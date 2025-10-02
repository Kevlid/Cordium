import { Core } from "../core";
import { ContextMenuCommandInteraction } from "discord.js";
import { ContextMenuCommandData } from "./contextMenu.types";

export class ContextMenuHandler {
    public core: Core;
    private globalCommands: Map<string, ContextMenuCommandData> = new Map();
    private guildCommands: Map<string, ContextMenuCommandData> = new Map();
    private loadedGlobalCommands: Set<string> = new Set();
    private loadedGuildCommands: Map<string, Set<string>> = new Map();

    constructor(core: Core) {
        this.core = core;
        this.core.client.on("interactionCreate", async (interaction) => {
            if (interaction.isContextMenuCommand()) {
                await this.onInteraction(interaction);
            }
        });
    }

    private async onInteraction(interaction: ContextMenuCommandInteraction): Promise<void> {
        /* Handle slash command */
    }

    public registerGlobal(command: ContextMenuCommandData): void {}
    public loadGlobal(commandName: string): void {}
    public unloadGlobal(commandName: string): void {}

    public registerGuild(command: ContextMenuCommandData): void {}
    public loadGuild(guildId: string, commandName: string): void {}
    public unloadGuild(guildId: string, commandName: string): void {}
}
