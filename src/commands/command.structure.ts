import type { Plugin } from "../plugins/plugin.structure";
import type {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    ContextMenuCommandInteraction,
    Message,
    PermissionResolvable,
} from "discord.js";
import { type CommandOptions, type CommandBuildOptions, CommandArgument } from "./command.types";
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
     * Description of the command
     * @type {string}
     * @example "Ban a user from the server"
     * @default "No description provided"
     */
    public description: string;

    /**
     * Whether the command is only usable in a guild
     * @type {boolean}
     * @default false
     */
    public guildOnly: boolean;

    /**
     * Aliases for the command
     * @type {Array<string>}
     * @example ["b", "banish"]
     * @default []
     */
    public aliases: Array<string>;

    /**
     * Arguments for the prefix command
     * @type {Array<CommandArgument>}
     * @example [{ name: "user", type: ArgumentTypes.STRING }]
     * @default []
     */
    public arguments: Array<CommandArgument>;

    /**
     * The plugin instance that this command belongs to
     * Bot permissions required to run the command
     * @type {Array<PermissionResolvable>}
     * @example ["BAN_MEMBERS", "KICK_MEMBERS"]
     */
    public botPermissions: Array<PermissionResolvable>;

    /**
     * The plugin instance that this command belongs to
     * @type {Plugin}
     */
    public plugin: Plugin;

    /**
     * A array of application commands
     * @type {string[]}
     */
    public applicationCommands: Array<string>;

    /**
     * Custom values for the command
     * @type {Record<string, any>}
     */
    public values?: Record<string, any>;

    constructor(buildOptions: Command.BuildOptions, options: Command.Options) {
        this.name = options.name;
        this.description = options.description || "No description provided";
        this.guildOnly = options.guildOnly || false;
        this.aliases = options.aliases || [];
        this.arguments = options.arguments || [];
        this.botPermissions = options.botPermissions || [];
        this.values = options.values;
        this.plugin = buildOptions.plugin;
        this.applicationCommands = new Array<string>();
    }

    public load(): void {
        if (container.commandStore.get((cmd: Command) => cmd.name === this.name)) {
            throw new Error(`Command with name ${this.name} already exists`);
        }
        container.commandStore.add(this);

        if (this.buildApplicationCommands) {
            const builder = this.buildApplicationCommands(new CommandBuilder());
            const slashCommandBuilders = builder.getSlashCommands();
            const contextMenuBuilders = builder.getContextMenuCommands();
            slashCommandBuilders.forEach((b) => {
                container.commandBuilderStore.add(b);
                this.applicationCommands.push(b.name);
            });
            contextMenuBuilders.forEach((b) => {
                container.commandBuilderStore.add(b);
                this.applicationCommands.push(b.name);
            });
        }
    }

    public unload(): void {
        if (!container.commandStore.get((cmd: Command) => cmd.name === this.name)) {
            throw new Error(`Command with name ${this.name} does not exist`);
        }
        container.commandStore.remove((cmd: Command) => cmd.name === this.name);

        // Remove associated application commands
        this.applicationCommands.forEach((commandName) => {
            container.commandBuilderStore.remove((b) => b.name === commandName);
        });
    }

    public buildApplicationCommands?(builder: CommandBuilder): CommandBuilder;
    public onAutocomplete?(interaction: AutocompleteInteraction): Promise<void> | void;
    public onChatInput?(interaction: ChatInputCommandInteraction): Promise<void> | void;
    public onContextMenu?(interaction: ContextMenuCommandInteraction): Promise<void> | void;
    public onMessage?(message: Message, ...args: any[]): Promise<void> | void;
}

export namespace Command {
    export type Options = CommandOptions;
    export type BuildOptions = CommandBuildOptions;
    export type Builder = CommandBuilder;
}
