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
        container.store.set("baseDirectory", config.baseDirectory);
        container.store.set("pluginDirectory", path.join(config.baseDirectory, "plugins"));

        this.loadPlugins();
        if (config.autoRegisterCommands) {
            this.registerCommands();
        }
    }

    public async loadPlugins(): Promise<void> {
        const pluginDir: string = container.store.get("pluginDirectory");

        if (!pluginDir) {
            throw new Error("Plugin directory not configured");
        }

        if (!fs.existsSync(pluginDir)) {
            console.warn(`Plugin directory does not exist: ${pluginDir}`);
            return;
        }

        try {
            const pluginPaths = this.discoverPlugins(pluginDir);
            const loadPromises = pluginPaths.map((pluginPath) => this.loadPlugin(pluginPath));
            await Promise.allSettled(loadPromises);
        } catch (error) {
            console.error("Failed to load plugins:", error);
            throw error;
        }
    }

    public async unloadPlugins(): Promise<void> {
        const plugins = Array.from(container.pluginStore);
        const unloadPromises = plugins.map((plugin) => plugin.unload());

        await Promise.allSettled(unloadPromises);
    }

    public async loadPlugin(pluginPath: string): Promise<void> {
        try {
            const { default: PluginClass, ...namedExports } = require(pluginPath);
            const ExportedPlugin = PluginClass || Object.values(namedExports)[0];

            if (!ExportedPlugin || typeof ExportedPlugin !== "function") {
                throw new Error(`No valid plugin class found in ${pluginPath}`);
            }

            const directoryPath = path.dirname(pluginPath);
            const instance = new ExportedPlugin({ directoryPath });

            if (!(instance instanceof Plugin)) {
                throw new Error(`Plugin ${pluginPath} does not extend the Plugin class`);
            }

            await instance.load();
        } catch (error) {
            console.error(`Failed to load plugin at ${pluginPath}:`, error);
            throw error;
        }
    }

    private discoverPlugins(pluginDir: string): string[] {
        const pluginFiles: string[] = [];

        const entries = fs.readdirSync(pluginDir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const folderPath = path.join(pluginDir, entry.name);
                const files = fs.readdirSync(folderPath);

                const pluginFile = files.find((file) => /plugin\.(ts|js|mjs|cjs)$/.test(file));

                if (pluginFile) {
                    pluginFiles.push(path.join(folderPath, pluginFile));
                }
            } else if (/plugin\.(ts|js|mjs|cjs)$/.test(entry.name)) {
                pluginFiles.push(path.join(pluginDir, entry.name));
            }
        }

        return pluginFiles;
    }

    public registerCommands(guildId?: string): void {
        const commandBuilders = Array.from(container.commandBuilderStore);
        this.client.once("clientReady", async () => {
            if (guildId && this.client.guilds.cache.get(guildId)) {
                await this.client.guilds.cache.get(guildId)?.commands.set(commandBuilders);
            } else {
                await this.client.application?.commands.set(commandBuilders);
            }
        });
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
