import { Client } from "discord.js";
import { Handler } from "./handler";
import { container } from "./container";
import { Plugin } from "./plugins/plugin.structure";
import path from "path";
import fs from "fs";

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

    constructor(client: Client, config: CordiumOptions) {
        container.core = this;
        container.client = client;

        this.handler = new Handler({
            loadMessageCommandListeners: true,
        });

        const defaultOptions = {
            prefix: "!",
            owners: [],
            isPluginEnabled: () => true,
            autoRegisterCommands: false,
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
        container.store.set("baseDirectory", config.baseDirectory);
        container.store.set("pluginDirectory", path.join(config.baseDirectory, "plugins"));
    }

    public init(): void {
        this.handler.loadPlugins();
        if (this.autoRegisterCommands) {
            this.handler.registerCommands();
            this.handler.unregisterCommands();
        }
    }
}

export interface CordiumOptions {
    baseDirectory: string;
    prefix?: Array<string> | string;
    owners?: Array<string> | string;
    autoRegisterCommands?: boolean;
    isPluginEnabled?: (pluginName: string, guildId: string) => boolean | Promise<boolean>;
}

export namespace Core {
    export type Options = CordiumOptions;
}
