import { ApplicationCommand, Interaction, Message } from "discord.js";
import { container } from "./container";
import { Plugin } from "./plugins/plugin.structure";
import { Event } from "./events/event.structure";
import { Command } from "./commands/command.structure";
import { pathToFileURL } from "url";
import path from "path";
import fs from "fs";

export class Handler {
    constructor(handlerOptions: Handler.Options) {
        if (handlerOptions.loadMessageCommandListeners) {
            container.client.on("messageCreate", (message: Message) => this.onMessageCreate(message));
        }
        container.client.on("interactionCreate", (interaction: Interaction) => this.onInteractionCreate(interaction));
    }

    public async onEventTriggered(eventName: string, ...args: any[]): Promise<void> {
        const event: Event | null = container.eventStore.get((e: Event) => e.name === eventName) || null;
        if (event) {
            await event.run(...args);
        }
    }

    public addEventListener(eventName: string): void {
        const loadedEvents = container.store.get("loadedEvents") || new Set<string>();
        if (!loadedEvents.has(eventName)) {
            container.client.on(eventName, (...args: any[]) => this.onEventTriggered(eventName, ...args));
        }
        loadedEvents.add(eventName);
        container.store.set("loadedEvents", loadedEvents);
    }

    public async onMessageCreate(message: Message): Promise<void> {
        if (message.author.bot) return;

        const prefixes: string[] = container.core.prefixes;
        const prefix = prefixes.find((p) => message.content.startsWith(p));
        if (!prefix) return;
        const [commandName, ...args] = message.content.slice(prefix.length).trim().split(/ +/g);
        if (!commandName) return;

        var command = container.commandStore.get(
            (cmd: Command) =>
                cmd.name === commandName || (Array.isArray(cmd.aliases) && cmd.aliases.includes(commandName))
        );
        if (!command) return;

        // Check for subcommand
        const subcommandName = commandName + " " + (args[0] || "");
        if (subcommandName) {
            const subcommand = container.commandStore.get(
                (cmd: Command) =>
                    cmd.name === subcommandName || (Array.isArray(cmd.aliases) && cmd.aliases.includes(subcommandName))
            );
            if (subcommand && subcommand.runMessage) {
                command = subcommand;
            }
        }

        if (command.runMessage) {
            await command.runMessage(message, ...args);
        }
    }

    public async onInteractionCreate(interaction: Interaction): Promise<void> {
        if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) return;

        if (interaction.isChatInputCommand()) {
            const commandName = interaction.commandName;
            var command = container.commandStore.get((cmd: Command) => cmd.applicationCommands.includes(commandName));
            if (!command) return;
            if (command.runChatInput) {
                await command.runChatInput(interaction);
            }
        } else if (interaction.isContextMenuCommand()) {
            const commandName = interaction.commandName;
            var command = container.commandStore.get((cmd: Command) => cmd.applicationCommands.includes(commandName));
            if (!command) return;
            if (command.runContextMenu) {
                await command.runContextMenu(interaction);
            }
        }
    }

    public async loadPlugins(): Promise<void> {
        const pluginDir: string = container.store.get("pluginDirectory");

        if (!pluginDir) {
            throw new Error("Plugin directory not configured");
        }

        if (!fs.existsSync(pluginDir)) {
            console.warn(`Plugin directory does not exist: ${pluginDir}`);
            return;
        }

        try {
            const pluginPaths = this.discoverPlugins(pluginDir);
            const loadPromises = pluginPaths.map((pluginPath) => this.loadPlugin(pluginPath));
            await Promise.allSettled(loadPromises);
        } catch (error) {
            console.error("Failed to load plugins:", error);
            throw error;
        }
    }

    public async unloadPlugins(): Promise<void> {
        const plugins = Array.from(container.pluginStore);
        const unloadPromises = plugins.map((plugin) => plugin.unload());

        await Promise.allSettled(unloadPromises);
    }

    public async loadPlugin(pluginPath: string): Promise<void> {
        try {
            const pluginUrl = pathToFileURL(pluginPath).href;
            const imported = await import(pluginUrl);
            const PluginClass = imported.default;
            const ExportedPlugin = PluginClass || Object.values(imported)[0];

            if (!ExportedPlugin || typeof ExportedPlugin !== "function") {
                throw new Error(`No valid plugin class found in ${pluginPath}`);
            }

            const directoryPath = path.dirname(pluginPath);
            const instance = new ExportedPlugin({ directoryPath });

            if (!(instance instanceof Plugin)) {
                throw new Error(`Plugin ${pluginPath} does not extend the Plugin class`);
            }

            await instance.load();
        } catch (error) {
            console.error(`Failed to load plugin at ${pluginPath}:`, error);
            throw error;
        }
    }

    private discoverPlugins(pluginDir: string): string[] {
        const pluginFiles: string[] = [];

        const entries = fs.readdirSync(pluginDir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const folderPath = path.join(pluginDir, entry.name);
                const files = fs.readdirSync(folderPath);

                const pluginFile = files.find((file) => /plugin\.(ts|js|mjs|cjs)$/.test(file));

                if (pluginFile) {
                    pluginFiles.push(path.join(folderPath, pluginFile));
                }
            } else if (/plugin\.(ts|js|mjs|cjs)$/.test(entry.name)) {
                pluginFiles.push(path.join(pluginDir, entry.name));
            }
        }

        return pluginFiles;
    }

    public async registerCommands(guildId?: string): Promise<void> {
        const commandBuilders = Array.from(container.commandBuilderStore);
        if (!container.client.isReady()) {
            await new Promise<void>((resolve) => container.client.once("clientReady", () => resolve()));
        }

        if (guildId && container.client.guilds.cache.get(guildId)) {
            container.client.guilds.cache.get(guildId)?.commands.set(commandBuilders);
        } else {
            container.client.application?.commands.set(commandBuilders);
        }
    }

    public async unregisterCommands(guildId?: string): Promise<void> {
        const loadedCommandNames = new Set(
            Array.from(container.commandStore, (cmd: Command) =>
                Array.isArray(cmd.applicationCommands) ? cmd.applicationCommands : []
            ).flat()
        );
        if (!container.client.isReady()) {
            await new Promise<void>((resolve) => container.client.once("clientReady", () => resolve()));
        }

        if (guildId) {
            const guild = container.client.guilds.cache.get(guildId);
            if (!guild) return;
            const existing = await guild.commands.fetch();
            const toDelete = existing.filter((cmd: ApplicationCommand) => !loadedCommandNames.has(cmd.name));
            await Promise.allSettled(toDelete.map((cmd: ApplicationCommand) => guild.commands.delete(cmd.id)));
        } else if (container.client.application) {
            const existing = await container.client.application.commands.fetch();
            const toDelete = existing.filter((cmd: ApplicationCommand) => !loadedCommandNames.has(cmd.name));
            await Promise.allSettled(
                toDelete.map((cmd: ApplicationCommand) => container.client.application!.commands.delete(cmd.id))
            );
        }
    }
}

interface HandlerOptions {
    loadMessageCommandListeners?: boolean;
}

export namespace Handler {
    export type Options = HandlerOptions;
}
