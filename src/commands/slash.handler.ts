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

    public registerGlobal(command: SlashCommandData): void {}
    public loadGlobal(commandName: string): void {}
    public unloadGlobal(commandName: string): void {}

    public registerGuild(command: SlashCommandData): void {}
    public loadGuild(guildId: string, commandName: string): void {}
    public unloadGuild(guildId: string, commandName: string): void {}
}
