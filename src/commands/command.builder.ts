import { ContextMenuCommandBuilder, SlashCommandBuilder } from "discord.js";

export class CommandBuilder {
    private slashCommands: SlashCommandBuilder[] = [];
    private contextMenuCommands: ContextMenuCommandBuilder[] = [];

    public buildSlashCommand(configure?: (slashCommand: SlashCommandBuilder) => void) {
        const builder = new SlashCommandBuilder();
        if (configure) {
            configure(builder);
        }
        this.slashCommands.push(builder);
        return builder;
    }

    public buildContextMenuCommand(configure?: (contextMenuCommand: ContextMenuCommandBuilder) => void) {
        const builder = new ContextMenuCommandBuilder();
        if (configure) {
            configure(builder);
        }
        this.contextMenuCommands.push(builder);
        return builder;
    }

    public getSlashCommands() {
        return this.slashCommands;
    }

    public getContextMenuCommands() {
        return this.contextMenuCommands;
    }
}
