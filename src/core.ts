import { Client } from "discord.js";
import { container } from "./container";
import { CordiumOptions } from "./types";
import { storage } from "./storage";
import { Plugin } from "./plugins/plugin.structure";
import { pluginStore } from "./plugins/plugin.store";
import path from "path";
import fs from "fs";

export class Core {
    /**
     * The discord.js client instance
     * @type {Client}
     */
    public client: Client;

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

        const defaultOptions = {
            prefix: "!",
            owners: [],
            isPluginEnabled: () => true,
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
        storage.set("baseDirectory", config.baseDirectory);
        storage.set("pluginDirectory", path.join(config.baseDirectory, "plugins"));
    }

    public async loadPlugins(): Promise<void> {
        const pluginDir: string = storage.get("pluginDirectory");

        if (!pluginDir) {
            throw new Error("Plugin directory not configured");
        }

        if (!fs.existsSync(pluginDir)) {
            console.warn(`Plugin directory does not exist: ${pluginDir}`);
            return;
        }

        console.log(`Loading plugins from ${pluginDir}`);

        try {
            const pluginPaths = this.discoverPlugins(pluginDir);
            const loadPromises = pluginPaths.map((pluginPath) => this.loadPlugin(pluginPath));
            await Promise.allSettled(loadPromises);

            console.log(`Successfully processed ${pluginPaths.length} plugin(s)`);
        } catch (error) {
            console.error("Failed to load plugins:", error);
            throw error;
        }
    }

    public async unloadPlugins(): Promise<void> {
        const plugins = Array.from(pluginStore);
        const unloadPromises = plugins.map((plugin) => plugin.unload());

        await Promise.allSettled(unloadPromises);
        console.log(`Unloaded ${plugins.length} plugin(s)`);
    }

    public async loadPlugin(pluginPath: string): Promise<void> {
        try {
            const { default: PluginClass, ...namedExports } = await import(pluginPath);
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
            console.log(`Loaded plugin: ${instance.name}`);
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
}

export namespace Core {
    export type Options = CordiumOptions;
}
