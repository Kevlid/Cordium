import { Client } from "discord.js";
import { CordiumOptions } from "./types";
import { PluginManager } from "./plugins/plugin.manager";
import { EventManager } from "./events/event.manager";
import { CommandManager } from "./commands/command.manager";

export class Core {
    public client: Client;
    public config: CordiumOptions;
    public pluginManager: PluginManager;
    public eventManager: EventManager;
    public commandManager: CommandManager;

    constructor(client: Client, config: CordiumOptions) {
        this.client = client;

        const defaultOptions: CordiumOptions = {
            prefix: "!",
            owners: [],
            plugins: [],
            isPluginEnabled: () => true,
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
        this.commandManager = new CommandManager(this);

        // Load plugins
        for (const plugin of this.config.plugins || []) {
            this.pluginManager.load(plugin);
        }
    }
}
