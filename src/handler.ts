import { ApplicationCommand, GuildMember, Interaction, Message } from "discord.js";
import type { Core } from "./core";
import { container } from "./container";
import { Plugin } from "./plugins/plugin.structure";
import { Event } from "./events/event.structure";
import { Command } from "./commands/command.structure";
import { ArgumentTypes, CommandArgument } from "./commands/command.types";
import { CommandArgumentError } from "./commands/command.error";
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
        const parts = message.content.slice(prefix.length).trim().split(/ +/g);
        const commandName = parts.shift() || "";
        const args: Array<any> = parts;
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
            if (subcommand && subcommand.onMessage) {
                command = subcommand;
            }
        }

        if (!command.onMessage) return;

        if (container.core.beforeCommandRun) {
            const context: Core.Context = {
                command: command,
                guild: message.guild || null,
                member: message.member || null,
                user: message.author || null,
                channel: message.channel || null,
                message: message || null,
                interaction: null,
            };
            const status = await container.core.beforeCommandRun(context);
            if (status === false) {
                return;
            }
        }

        if (command.arguments && Array.isArray(command.arguments)) {
            const result = await this.resolveMessageArguments(message, command.arguments, args).catch(async (err) => {
                if (err) await message.reply(String(err));
                return null;
            });

            if (!result) return;
            args.splice(0, args.length, ...result);
        }

        await command.onMessage(message, ...args);
    }

    private async resolveMessageArguments(
        message: Message,
        argumentTypes: Array<CommandArgument>,
        args: string[]
    ): Promise<any[]> {
        const resolvedArgs: any[] = [];

        for (let i = 0; i < argumentTypes.length; i++) {
            const argDef = argumentTypes[i];
            var argValue = args[0];
            var clearArg = true;
            var onlyOneUser =
                argumentTypes.filter((a) => [ArgumentTypes.User, ArgumentTypes.Member].includes(a.type)).length === 1;

            if (!argValue) {
                throw new CommandArgumentError(argDef.name, argDef.type, argValue || null);
            }

            if (typeof argDef.default === "string") {
                argValue = argValue || argDef.default;
            }

            switch (argDef.type) {
                case ArgumentTypes.User: {
                    argValue = String(argValue).replace("<@", "").replace(">", "");
                    if (!isNaN(Number(argValue)) && onlyOneUser) {
                        let messageId = message.reference?.messageId;
                        var referencedMessage = null;
                        if (messageId) {
                            referencedMessage =
                                message.channel.messages.cache.get(messageId) ||
                                (await message.channel.messages.fetch(messageId).catch(() => null));
                        }
                        if (referencedMessage) {
                            argValue = referencedMessage.author.id;
                            clearArg = false;
                        }
                    }
                    var user =
                        message.client.users.cache.get(argValue) ||
                        (await message.client.users.fetch(argValue).catch(() => null));
                    if (!user && argDef.default === true) {
                        user = message.author;
                    }
                    if (!user && argDef.required !== false) {
                        throw new CommandArgumentError(argDef.name, argDef.type, argValue);
                    }
                    resolvedArgs.push(user);
                    break;
                }

                case ArgumentTypes.Member: {
                    if (!message.guild) {
                        throw new Error("Members can only be resolved in guilds");
                    }
                    argValue = String(argValue).replace("<@", "").replace(">", "");
                    if (!isNaN(Number(argValue)) && onlyOneUser) {
                        let messageId = message.reference?.messageId;
                        var referencedMessage = null;
                        if (messageId) {
                            referencedMessage =
                                message.channel.messages.cache.get(messageId) ||
                                (await message.channel.messages.fetch(messageId).catch(() => null));
                        }
                        if (referencedMessage) {
                            argValue = referencedMessage.author.id;
                            clearArg = false;
                        }
                    }
                    var member =
                        message.guild?.members.cache.get(argValue) ||
                        (await message.guild?.members.fetch(argValue).catch(() => null));
                    if (!member && argDef.default === true) {
                        member =
                            message.guild.members.cache.get(message.author.id) ||
                            (await message.guild.members.fetch(message.author.id).catch(() => null));
                    }
                    if (!member && argDef.required !== false) {
                        throw new CommandArgumentError(argDef.name, argDef.type, argValue);
                    }
                    resolvedArgs.push(member);
                    break;
                }

                case ArgumentTypes.Role: {
                    if (!message.guild) {
                        throw new Error("Roles can only be resolved in guilds");
                    }
                    argValue = String(argValue).replace("<@&", "").replace(">", "");
                    const role =
                        message.guild.roles.cache.get(argValue) ||
                        (await message.guild.roles.fetch(argValue).catch(() => null));
                    if (!role && argDef.required !== false) {
                        throw new CommandArgumentError(argDef.name, argDef.type, argValue);
                    }
                    resolvedArgs.push(role);
                    break;
                }

                case ArgumentTypes.Channel: {
                    if (!message.guild) {
                        throw new Error("Channels can only be resolved in guilds");
                    }
                    argValue = String(argValue).replace("<#", "").replace(">", "");
                    var channel =
                        message.client.channels.cache.get(argValue) ||
                        (await message.client.channels.fetch(argValue).catch(() => null));
                    if (!channel && argDef.default === true) {
                        channel = message.channel;
                    }
                    if (!channel && argDef.required !== false) {
                        throw new CommandArgumentError(argDef.name, argDef.type, argValue);
                    }
                    resolvedArgs.push(channel);
                    break;
                }

                case ArgumentTypes.Boolean: {
                    var boolValue = null;
                    if (argValue.toLowerCase() === "true" || argValue.toLowerCase() === "yes" || argValue === "1") {
                        boolValue = true;
                    } else if (
                        argValue.toLowerCase() === "false" ||
                        argValue.toLowerCase() === "no" ||
                        argValue === "0"
                    ) {
                        boolValue = false;
                    }
                    if (boolValue === null && argDef.required !== false) {
                        throw new CommandArgumentError(argDef.name, argDef.type, argValue);
                    }
                    resolvedArgs.push(boolValue);
                    break;
                }

                case ArgumentTypes.Number: {
                    const numberValue = Number(argValue);
                    if (isNaN(numberValue) && argDef.required !== false) {
                        throw new CommandArgumentError(argDef.name, argDef.type, argValue);
                    }
                    resolvedArgs.push(numberValue);
                    break;
                }

                case ArgumentTypes.String: {
                    if (argDef.rest) {
                        if (!argValue && argDef.required !== false) {
                            throw new CommandArgumentError(argDef.name, argDef.type, argValue);
                        }
                        resolvedArgs.push(args.join(" "));
                        args.length = 0;
                    } else {
                        if (!argValue && argDef.required !== false) {
                            throw new CommandArgumentError(argDef.name, argDef.type, argValue);
                        }
                        resolvedArgs.push(argValue);
                    }
                    break;
                }

                default: {
                    throw new CommandArgumentError(argDef.name, null, argValue);
                }
            }
            if (clearArg) {
                args.shift();
            }
        }

        return resolvedArgs;
    }

    public async onInteractionCreate(interaction: Interaction): Promise<void> {
        if (interaction.isAutocomplete()) {
            const commandName = interaction.commandName;
            var command = container.commandStore.get((cmd: Command) => cmd.applicationCommands.includes(commandName));
            if (!command) return;
            if (container.core.beforeCommandRun) {
                const context: Core.Context = {
                    command: command,
                    guild: interaction.guild || null,
                    member: (interaction.member as GuildMember) || null,
                    user: interaction.user || null,
                    channel: interaction.channel || null,
                    message: null,
                    interaction: interaction || null,
                };
                const status = await container.core.beforeCommandRun(context);
                if (status === false) {
                    return;
                }
            }
            if (command.onAutocomplete) {
                await command.onAutocomplete(interaction);
            }
        } else if (interaction.isChatInputCommand()) {
            const commandName = interaction.commandName;
            var command = container.commandStore.get((cmd: Command) => cmd.applicationCommands.includes(commandName));
            if (!command) return;
            if (container.core.beforeCommandRun) {
                const context: Core.Context = {
                    command: command,
                    guild: interaction.guild || null,
                    member: (interaction.member as GuildMember) || null,
                    user: interaction.user || null,
                    channel: interaction.channel || null,
                    message: null,
                    interaction: interaction || null,
                };
                const status = await container.core.beforeCommandRun(context);
                if (status === false) {
                    return;
                }
            }
            if (command.onChatInput) {
                await command.onChatInput(interaction);
            }
        } else if (interaction.isContextMenuCommand()) {
            const commandName = interaction.commandName;
            var command = container.commandStore.get((cmd: Command) => cmd.applicationCommands.includes(commandName));
            if (!command) return;
            if (container.core.beforeCommandRun) {
                const context: Core.Context = {
                    command: command,
                    guild: interaction.guild || null,
                    member: (interaction.member as GuildMember) || null,
                    user: interaction.user || null,
                    channel: interaction.channel || null,
                    message: null,
                    interaction: interaction || null,
                };
                const status = await container.core.beforeCommandRun(context);
                if (status === false) {
                    return;
                }
            }
            if (command.onContextMenu) {
                await command.onContextMenu(interaction);
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
            let imported;
            try {
                const pluginUrl = pathToFileURL(path.resolve(pluginPath)).href;
                imported = await import(pluginUrl);
            } catch (err) {
                imported = require(path.resolve(pluginPath));
            }
            const ExportedPlugin = imported.default || Object.values(imported)[0];

            const PluginClass =
                typeof ExportedPlugin === "function"
                    ? ExportedPlugin
                    : Object.values(ExportedPlugin).find(
                          (v) => typeof v === "function" && v.prototype instanceof Plugin
                      );

            if (!PluginClass) {
                throw new Error(`No valid plugin class found in ${pluginPath}`);
            }

            const directoryPath = path.dirname(pluginPath);
            const instance = new PluginClass({ directoryPath });
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
        if (!container.client.isReady()) {
            await new Promise<void>((resolve) => container.client.once("clientReady", () => resolve()));
        }
        const commandBuilders = Array.from(container.commandBuilderStore);

        if (guildId && container.client.guilds.cache.get(guildId)) {
            container.client.guilds.cache.get(guildId)?.commands.set(commandBuilders);
        } else {
            container.client.application?.commands.set(commandBuilders);
        }
    }

    public async unregisterCommands(guildId?: string): Promise<void> {
        if (!container.client.isReady()) {
            await new Promise<void>((resolve) => container.client.once("clientReady", () => resolve()));
        }
        const loadedCommandNames = new Set(
            Array.from(container.commandStore, (cmd: Command) =>
                Array.isArray(cmd.applicationCommands) ? cmd.applicationCommands : []
            ).flat()
        );

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

    public async unregisterAllCommands(guildId?: string): Promise<void> {
        if (!container.client.isReady()) {
            await new Promise<void>((resolve) => container.client.once("clientReady", () => resolve()));
        }
        if (guildId) {
            const guild = container.client.guilds.cache.get(guildId);
            if (!guild) return;
            await guild.commands.set([]);
        } else if (container.client.application) {
            await container.client.application.commands.set([]);
        }
    }
}

interface HandlerOptions {
    loadMessageCommandListeners?: boolean;
}

export namespace Handler {
    export type Options = HandlerOptions;
}
