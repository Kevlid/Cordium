import { Client } from "discord.js";
import { CordiumOptions } from "./types";
import { PluginManager } from "./plugins/plugin.manager";
import { EventManager } from "./events/event.manager";

export class Core {
    public client: Client;
    public config: CordiumOptions;
    public pluginManager: PluginManager;
    public eventManager: EventManager;

    constructor(client: Client, config: CordiumOptions) {
        this.client = client;

        const defaultOptions: CordiumOptions = {
            prefix: "!",
            owners: [],
            globalPlugins: [],
            guildPlugins: [],
        };
        config = { ...defaultOptions, ...config };
        if (typeof config.prefix === "string") {
            config.prefix = [config.prefix];
        }
        if (typeof config.owners === "string") {
            config.owners = [config.owners];
        }
        this.config = config;

        this.pluginManager = new PluginManager(this);
        this.eventManager = new EventManager(this);
    }
}
