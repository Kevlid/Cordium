import { Core } from "../core";
import { Message } from "discord.js";
import { PrefixCommandData } from "./prefix.types";

export class PrefixHandler {
    private core: Core;
    private commands = new Map<string, PrefixCommandData>();

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

        /*// Get global commands
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
        }*/
    }

    public load(command: PrefixCommandData): void {
        const commandId = `${command.pluginName}:${command.name}`;
        if (this.commands.has(commandId)) {
            throw new Error(`Prefix command with id ${commandId} is already registered`);
        }
        this.commands.set(commandId, command);
    }

    public unload(commandId: string): void {
        if (!this.commands.has(commandId)) {
            throw new Error(`Prefix command with id ${commandId} is not registered`);
        }
        this.commands.delete(commandId);
    }
}
