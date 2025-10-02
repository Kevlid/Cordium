import { Core } from "../core";
import { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandData } from "./slash.types";

export class SlashHandler {
    public core: Core;
    private globalCommands: Map<string, SlashCommandData> = new Map();
    private guildCommands: Map<string, SlashCommandData> = new Map();
    private loadedGlobalCommands: Set<string> = new Set();
    private loadedGuildCommands: Map<string, Set<string>> = new Map();

    constructor(core: Core) {
        this.core = core;
        this.core.client.on("interactionCreate", async (interaction) => {
            if (interaction.isChatInputCommand()) {
                await this.onInteraction(interaction);
            }
        });
    }

    private async onInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
        /* Handle slash command */
    }

    public registerGlobal(command: SlashCommandData): void {
        const commandId = `${command.pluginName}:${command.name}`;
        if (this.globalCommands.has(commandId)) {
            throw new Error(`Global slash command with ID ${commandId} already exists`);
        }
    }

    public loadGlobal(commandId: string): void {
        const command = this.globalCommands.get(commandId);
        if (!command) {
            throw new Error(`Global slash command with ID ${commandId} does not exist`);
        }
        if (this.loadedGlobalCommands.has(commandId)) {
            throw new Error(`Global slash command with ID ${commandId} is already loaded`);
        }
        this.loadedGlobalCommands.add(commandId);
    }
    public unloadGlobal(commandId: string): void {
        if (!this.loadedGlobalCommands.has(commandId)) {
            throw new Error(`Global slash command with ID ${commandId} is not loaded`);
        }
        this.loadedGlobalCommands.delete(commandId);
    }

    public registerGuild(command: SlashCommandData): void {
        const commandId = `${command.pluginName}:${command.name}`;
        if (this.guildCommands.has(commandId)) {
            throw new Error(`Guild slash command with ID ${commandId} already exists`);
        }
        this.guildCommands.set(commandId, command);
    }

    public loadGuild(guildId: string, commandName: string): void {
        const commandId = `${guildId}:${commandName}`;
        const command = this.guildCommands.get(commandId);
        if (!command) {
            throw new Error(`Guild slash command with ID ${commandId} does not exist`);
        }
        if (this.loadedGuildCommands.has(guildId)) {
            throw new Error(`Guild slash command with ID ${commandId} is already loaded`);
        }
        const loadedCommands = this.loadedGuildCommands.get(guildId) || new Set<string>();
        if (loadedCommands.has(commandId)) {
            throw new Error(`Guild slash command with id ${commandId} is already loaded in guild ${guildId}`);
        }
        loadedCommands.add(commandId);
        this.loadedGuildCommands.set(guildId, loadedCommands);
    }

    public unloadGuild(guildId: string, commandName: string): void {
        const commandId = `${guildId}:${commandName}`;
        if (!this.loadedGuildCommands.has(guildId)) {
            throw new Error(`Guild slash command with ID ${commandId} is not loaded`);
        }
        this.loadedGuildCommands.get(guildId)?.delete(commandId);
    }
}
