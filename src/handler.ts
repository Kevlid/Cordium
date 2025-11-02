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
        const events: Event[] = Array.from(container.eventStore).filter((e: Event) => e.name === eventName);
        for (const event of events) {
            event.run(...args);
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
        if (command.guildOnly && (!message.guild || !message.guildId)) return;

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
            let result = null;
            try {
                this.validateArgumentTypes(command.arguments);
                result = await this.resolveMessageArguments(message, command.arguments, args);
            } catch (err) {
                await message.reply(String(err));
                result = null;
            }

            if (!result) return;
            args.splice(0, args.length, ...result);
        }

        await command.onMessage(message, ...args);
    }

    private validateArgumentTypes(argumentTypes: Array<CommandArgument>): void {
        const textIndex = argumentTypes.findIndex((arg) => arg.type === ArgumentTypes.Text);
        if (textIndex !== -1 && textIndex !== argumentTypes.length - 1) {
            throw new Error("No arguments can follow an argument of type 'Text'");
        }
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

            if (!argValue && argDef.required !== false && argDef.default === undefined) {
                throw new Error(`Argument of type "${argDef.type}" is required but was not provided`);
            }

            switch (argDef.type) {
                case ArgumentTypes.User: {
                    argValue = String(argValue).replace("<@", "").replace(">", "");
                    var user =
                        message.client.users.cache.get(argValue) ||
                        (await message.client.users.fetch(argValue).catch(() => null));
                    if (!user && onlyOneUser) {
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
                            user =
                                message.client.users.cache.get(argValue) ||
                                (await message.client.users.fetch(argValue).catch(() => null));
                        }
                    }
                    if (!user && argDef.default === true) {
                        user = message.author;
                        clearArg = false;
                    }
                    if (!user && argDef.required !== false) {
                        throw new Error(`Argument of type "${argDef.type}" is required but was not provided`);
                    }
                    resolvedArgs.push(user || null);
                    break;
                }

                case ArgumentTypes.Member: {
                    if (!message.guild) {
                        throw new Error("Members can only be resolved in guilds");
                    }
                    argValue = String(argValue).replace("<@", "").replace(">", "");
                    var member =
                        message.guild?.members.cache.get(argValue) ||
                        (await message.guild?.members.fetch(argValue).catch(() => null));
                    if (!member && onlyOneUser) {
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
                            member =
                                message.guild.members.cache.get(argValue) ||
                                (await message.guild.members.fetch(argValue).catch(() => null));
                        }
                    }
                    if (!member && argDef.default === true) {
                        member =
                            message.guild.members.cache.get(message.author.id) ||
                            (await message.guild.members.fetch(message.author.id).catch(() => null));
                        clearArg = false;
                    }
                    if (!member && argDef.required !== false) {
                        throw new Error(`Argument of type "${argDef.type}" is required but was not provided`);
                    }
                    resolvedArgs.push(member || null);
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
                        throw new Error(`Argument of type "${argDef.type}" is required but was not provided`);
                    }
                    resolvedArgs.push(role || null);
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
                        clearArg = false;
                    }
                    if (!channel && argDef.required !== false) {
                        throw new Error(`Argument of type "${argDef.type}" is required but was not provided`);
                    }
                    resolvedArgs.push(channel || null);
                    break;
                }

                case ArgumentTypes.Boolean: {
                    var boolValue = null;
                    argValue = argValue?.toLowerCase();
                    if (["true", "yes", "1"].includes(argValue)) {
                        boolValue = true;
                    } else if (["false", "no", "0"].includes(argValue)) {
                        boolValue = false;
                    }
                    if (boolValue === null && typeof argDef.default === "boolean") {
                        boolValue = argDef.default;
                        clearArg = false;
                    }
                    if (boolValue === null && argDef.required !== false) {
                        throw new Error(`Argument of type "${argDef.type}" is required but was not provided`);
                    }
                    resolvedArgs.push(boolValue || null);
                    break;
                }

                case ArgumentTypes.Number: {
                    var numberValue = Number(argValue);
                    if (isNaN(numberValue) && typeof argDef.default === "number") {
                        numberValue = argDef.default;
                        clearArg = false;
                    }
                    if (isNaN(numberValue) && argDef.required !== false) {
                        throw new Error(`Argument of type "${argDef.type}" is required but was not provided`);
                    }
                    resolvedArgs.push(numberValue || null);
                    break;
                }

                case ArgumentTypes.String: {
                    if (!argValue && typeof argDef.default === "string") {
                        argValue = argDef.default;
                    }
                    if (!argValue && argDef.required !== false) {
                        throw new Error(`Argument of type "${argDef.type}" is required but was not provided`);
                    }
                    resolvedArgs.push(argValue || null);
                    break;
                }

                case ArgumentTypes.Text: {
                    if (!argValue && typeof argDef.default === "string") {
                        argValue = argDef.default;
                    } else {
                        argValue = args.join(" ");
                        args.length = 0;
                    }
                    if (!argValue && argDef.required !== false) {
                        throw new Error(`Argument of type "${argDef.type}" is required but was not provided`);
                    }
                    resolvedArgs.push(argValue || null);
                }

                case ArgumentTypes.Date: {
                    if (!argValue) {
                        if (argDef.default instanceof Date) {
                            resolvedArgs.push(argDef.default);
                        } else if (argDef.required !== false) {
                            throw new Error(`Argument of type "${argDef.type}" is required but was not provided`);
                        }
                        break;
                    }

                    let now = new Date();

                    // 1s, 1m, 1h, 1d, 21d4h5m3s
                    let relativeTimeMatch = argValue.match(/(\d+d)?(\d+h)?(\d+m)?(\d+s)?/);
                    if (relativeTimeMatch) {
                        let [, days, hours, minutes, seconds] = relativeTimeMatch;
                        let totalMilliseconds = 0;

                        if (days) totalMilliseconds += parseInt(days, 10) * 24 * 60 * 60 * 1000;
                        if (hours) totalMilliseconds += parseInt(hours, 10) * 60 * 60 * 1000;
                        if (minutes) totalMilliseconds += parseInt(minutes, 10) * 60 * 1000;
                        if (seconds) totalMilliseconds += parseInt(seconds, 10) * 1000;

                        if (totalMilliseconds > 0) {
                            resolvedArgs.push(new Date(now.getTime() + totalMilliseconds));
                            break;
                        }
                    }

                    let timeFormats = [
                        { regex: /^(\d{1,2}):(\d{2})$/, handler: ([h, m]: string[]) => now.setHours(+h, +m, 0, 0) }, // 10:30
                        {
                            regex: /^(\d{1,2})(am|pm)$/i,
                            handler: ([h, period]: string[]) =>
                                now.setHours(period.toLowerCase() === "pm" ? +h + 12 : +h, 0, 0, 0),
                        }, // 5pm
                        {
                            regex: /^(\d{1,2}):(\d{2})(am|pm)$/i,
                            handler: ([h, m, period]: string[]) =>
                                now.setHours(period.toLowerCase() === "pm" ? +h + 12 : +h, +m, 0, 0),
                        }, // 5:30pm
                    ];

                    let matchedFormat = timeFormats.find(({ regex }) => regex.test(argValue));
                    if (matchedFormat) {
                        let match = argValue.match(matchedFormat.regex)!.slice(1);
                        resolvedArgs.push(new Date(matchedFormat.handler(match)));
                        break;
                    }

                    let parsedDate = new Date(argValue);
                    if (isNaN(parsedDate.getTime())) {
                        throw new Error(`Argument of type "${argDef.type}" is required but was not provided`);
                    }
                    resolvedArgs.push(parsedDate);
                    break;
                }

                default: {
                    throw new Error(`Argument of type "${argDef.type}" is required but was not provided`);
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
