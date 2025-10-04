import type { Plugin } from "../plugins/plugin.structure";
import type { ChatInputCommandInteraction, ContextMenuCommandInteraction, Message } from "discord.js";
import type { CommandOptions, CommandBuildOptions } from "./command.types";
import { CommandBuilder } from "./command.builder";
import { container } from "../container";

export abstract class Command {
    /**
     * Command name
     * @type {string}
     * @example "ban"
     */
    public name: string;

    /**
     * Aliases for the command
     * @type {Array<string>}
     * @example ["b", "banish"]
     * @default []
     */
    public aliases: Array<string>;

    /**
     * The plugin instance that this event belongs to
     * @type {Plugin}
     */
    public plugin: Plugin;

    constructor(buildOptions: Command.BuildOptions, options: Command.Options) {
        this.name = options.name;
        this.aliases = options.aliases || [];
        this.plugin = buildOptions.plugin;
    }

    public load(): void {
        if (container.commandStore.get((cmd: Command) => cmd.name === this.name)) {
            throw new Error(`Command with name ${this.name} already exists`);
        }
        container.commandStore.add(this);

        if (this.build) {
            const builder = this.build(new CommandBuilder());
            const slashCommandBuilders = builder.getSlashCommands();
            const contextMenuBuilders = builder.getContextMenuCommands();
            slashCommandBuilders.forEach((b) => container.commandBuilderStore.add(b));
            contextMenuBuilders.forEach((b) => container.commandBuilderStore.add(b));
        }
    }

    public unload(): void {}

    public build?(builder: CommandBuilder): CommandBuilder;
    public runChatInput?(interaction: ChatInputCommandInteraction): Promise<void> | void;
    public runContextMenu?(interaction: ContextMenuCommandInteraction): Promise<void> | void;
    public runMessage?(message: Message, ...args: any[]): Promise<void> | void;
}

export namespace Command {
    export type Options = CommandOptions;
    export type BuildOptions = CommandBuildOptions;
    export type Builder = CommandBuilder;
}
