import { Core } from "../core";
import { Message } from "discord.js";
import { PrefixCommandData } from "./prefix.types";

export class PrefixHandler {
    private core: Core;
    private globalCommands = new Map<string, PrefixCommandData>();
    private guildCommands = new Map<string, PrefixCommandData>();
    private loadedGlobalCommands = new Set<string>();
    private loadedGuildCommands = new Map<string, Set<string>>();

    constructor(core: Core) {
        this.core = core;
        this.core.client.on("messageCreate", this.onMessage.bind(this));
    }

    private onMessage(message: Message): void {
        if (message.author.bot) return;

        // Check if the message starts with a prefix
        const prefixes = Array.isArray(this.core.config.prefix)
            ? this.core.config.prefix
            : [this.core.config.prefix || "!"];
        if (!prefixes.some((p) => message.content.startsWith(p))) return;

        // Get the command name
        const args = message.content.split(" ");
        const prefix = prefixes.find((p) => message.content.startsWith(p)) || "";
        const commandName = args[0].slice(prefix.length).toLowerCase();
        if (!commandName) return;

        // Get global commands
        const loadedGlobalCommandIds = [...this.loadedGlobalCommands];
        const loadedGlobalCommands: PrefixCommandData[] = loadedGlobalCommandIds
            .map((id) => this.globalCommands.get(id))
            .filter((command): command is PrefixCommandData => command !== undefined);

        // Get guild commands
        const guildId = message.guild?.id;
        const loadedGuildCommandIds = guildId ? [...(this.loadedGuildCommands.get(guildId) || [])] : [];
        const loadedGuildCommands: PrefixCommandData[] = loadedGuildCommandIds
            .map((id) => this.guildCommands.get(id))
            .filter((command): command is PrefixCommandData => command !== undefined);

        // Find all loaded global commands that match the command name
        const matchingCommands = new Array<PrefixCommandData>();
        for (const command of [...loadedGlobalCommands, ...loadedGuildCommands]) {
            if (command.name === commandName || command.aliases?.includes(commandName)) {
                matchingCommands.push(command);
            }
        }

        if (matchingCommands.length === 0) return;
        for (const command of matchingCommands) {
            // Execute the command
            const commandData = {
                message,
                args: args.slice(1),
            };

            const pluginData = this.core.pluginManager.getPluginData();
            command.execute(pluginData, commandData, ...args.slice(1));
        }
    }

    public registerGlobal(command: PrefixCommandData): void {
        const commandId = `${command.pluginName}:${command.name}`;
        if (this.globalCommands.has(commandId)) {
            throw new Error(`Global prefix command with id ${commandId} is already registered`);
        }
        this.globalCommands.set(commandId, command);
    }

    public loadGlobal(commandId: string): void {
        const command = this.globalCommands.get(commandId);
        if (!command) {
            throw new Error(`Global prefix command with id ${commandId} is not registered`);
        }
        if (this.loadedGlobalCommands.has(commandId)) {
            throw new Error(`Global prefix command with id ${commandId} is already loaded`);
        }
        this.loadedGlobalCommands.add(commandId);
    }

    public unloadGlobal(commandId: string): void {
        const command = this.globalCommands.get(commandId);
        if (!command) {
            throw new Error(`Global prefix command with id ${commandId} is not registered`);
        }
        if (!this.loadedGlobalCommands.has(commandId)) {
            throw new Error(`Global prefix command with id ${commandId} is not loaded`);
        }
        this.loadedGlobalCommands.delete(commandId);
    }

    public registerGuild(command: PrefixCommandData): void {
        const commandId = `${command.pluginName}:${command.name}`;
        if (this.guildCommands.has(commandId)) {
            throw new Error(`Guild prefix command with id ${commandId} is already registered`);
        }
        this.guildCommands.set(commandId, command);
    }

    public loadGuild(guildId: string, commandId: string): void {
        const command = this.guildCommands.get(commandId);
        if (!command) {
            throw new Error(`Guild prefix command with id ${commandId} is not registered`);
        }
        const loadedCommands = this.loadedGuildCommands.get(guildId) || new Set<string>();
        if (loadedCommands.has(commandId)) {
            throw new Error(`Guild prefix command with id ${commandId} is already loaded in guild ${guildId}`);
        }
        loadedCommands.add(commandId);
        this.loadedGuildCommands.set(guildId, loadedCommands);
    }

    public unloadGuild(guildId: string, commandId: string): void {
        const command = this.guildCommands.get(commandId);
        if (!command) {
            throw new Error(`Guild prefix command with id ${commandId} is not registered`);
        }
        const loadedCommands = this.loadedGuildCommands.get(guildId);
        if (!loadedCommands || !loadedCommands.has(commandId)) {
            throw new Error(`Guild prefix command with id ${commandId} is not loaded in guild ${guildId}`);
        }
        loadedCommands.delete(commandId);
        this.loadedGuildCommands.set(guildId, loadedCommands);
    }
}
