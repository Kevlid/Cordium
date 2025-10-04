import { PluginBuildOptions, PluginOptions } from "./plugin.types";
import { pluginStore } from "./plugin.store";
import path from "path";
import fs from "fs";

export class Plugin {
    /**
     * Plugin name
     * @type {string}
     * @example "My Plugin"
     */
    public name: string;

    /**
     * Plugin description
     * @type {string}
     * @example "This is my plugin"
     */
    public description?: string;

    /**
     * The path to the directory where the plugin is located
     * @type {string}
     */
    public directoryPath: string;

    /**
     * The path to the event directory
     * @type {string}
     */
    public eventPath: string | null = null;

    constructor(buildOptions: Plugin.BuildOptions, options: Plugin.Options) {
        this.name = options.name || this.constructor.name;
        this.description = options.description;
        this.directoryPath = buildOptions.directoryPath;

        // Set up the paths
        const eventDir = options.eventPath
            ? path.join(this.directoryPath, options.eventPath)
            : path.join(this.directoryPath, "events");
        this.eventPath = fs.existsSync(eventDir) ? eventDir : null;
    }

    public load(): void {
        if (pluginStore.get(this.name)) {
            throw new Error(`Plugin with name ${this.name} already exists`);
        }

        // Scan the directory for events and commands and load them
        if (this.eventPath) {
            const eventFiles = fs
                .readdirSync(this.eventPath)
                .filter(
                    (file) =>
                        file.endsWith("event.ts") ||
                        file.endsWith("event.js") ||
                        file.endsWith("event.mjs") ||
                        file.endsWith("event.cjs")
                );
            for (const file of eventFiles) {
                const eventPath = path.join(this.eventPath, file);
                console.log(import(eventPath));
            }
        }

        // Load the plugin
    }

    public unload(): void {
        if (!pluginStore.get(this.name)) {
            throw new Error(`Plugin with name ${this.name} does not exist`);
        }
        // Unload the plugin
    }
}

export namespace Plugin {
    export type Options = PluginOptions;
    export type BuildOptions = PluginBuildOptions;
}
