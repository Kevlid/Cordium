import { Channel, Client, Guild, GuildMember, Interaction, Message, User } from "discord.js";
import { Handler } from "./handler";
import { container } from "./container";
import type { Command } from "./commands/command.structure";
import path from "path";

export class Core {
    /**
     * The discord.js client instance
     * @type {Client}
     */
    public client: Client;

    /**
     * Handles command and events when triggered
     */
    public handler: Handler;

    /**
     * The prefix(es) for the bot
     * @type {string[]}
     */
    public prefixes: Array<string>;

    /**
     * The owner(s) of the bot
     * @type {string[]}
     */
    public owners: Array<string>;

    /**
     * If the Discord application Commands should be automatically registered
     * @type {boolean}
     * @example true
     */
    public autoRegisterCommands: boolean;

    /**
     * Checks if a plugin is enabled in a guild.
     * @type {Function}
     */
    public isPluginEnabled: Function | null;

    /**
     * Run function before a command is executed
     * @type {Function}
     */
    public beforeCommandRun: Function | null;

    constructor(client: Client, config: CordiumOptions) {
        container.core = this;
        container.client = client;

        this.handler = new Handler({
            loadMessageCommandListeners: true,
        });

        const defaultOptions = {
            prefix: "!",
        };
        config = { ...defaultOptions, ...config };
        if (typeof config.prefix === "string") {
            config.prefix = [config.prefix];
        }
        if (typeof config.owners === "string") {
            config.owners = [config.owners];
        }
        this.client = client;
        this.prefixes = config.prefix || [];
        this.owners = config.owners || [];
        this.autoRegisterCommands = config.autoRegisterCommands || false;
        container.store.set("applicationCommandGuildId", config.applicationCommandGuildId || null);
        this.isPluginEnabled = config.isPluginEnabled || null;
        this.beforeCommandRun = config.beforeCommandRun || null;
        container.store.set("baseDirectory", config.baseDirectory);
        container.store.set("pluginDirectory", path.join(config.baseDirectory, "plugins"));
    }

    public async init(): Promise<void> {
        await this.handler.loadPlugins();
        if (this.autoRegisterCommands) {
            const gid = container.store.get("applicationCommandGuildId") || null;
            this.handler.registerCommands(gid);
            this.handler.unregisterCommands();
        }
    }
}

export interface CordiumOptions {
    baseDirectory: string;
    prefix?: Array<string> | string;
    owners?: Array<string> | string;
    autoRegisterCommands?: boolean;
    applicationCommandGuildId?: string;
    isPluginEnabled?: (pluginName: string, guildId: string) => boolean | Promise<boolean>;
    beforeCommandRun?: (context: Core.Context) => boolean | Promise<boolean>;
}

export interface CoreContext {
    command?: Command;
    guild?: Guild | null;
    member?: GuildMember | null;
    user?: User | null;
    channel?: Channel | null;
    message?: Message | null;
    interaction?: Interaction | null;
}

export namespace Core {
    export type Options = CordiumOptions;
    export type Context = CoreContext;
}
