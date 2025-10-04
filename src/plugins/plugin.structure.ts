import type { PluginBuildOptions, PluginOptions } from "./plugin.types";
import { Event } from "../events/event.structure";
import { Command } from "../commands/command.structure";
import { container } from "../container";
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

    /**
     * The path to the command directory
     * @type {string}
     */
    public commandPath: string | null = null;

    constructor(buildOptions: Plugin.BuildOptions, options: Plugin.Options) {
        this.name = options.name || this.constructor.name;
        this.description = options.description;
        this.directoryPath = buildOptions.directoryPath;

        // Set up the paths
        const eventDir = options.eventPath
            ? path.join(this.directoryPath, options.eventPath)
            : path.join(this.directoryPath, "events");
        this.eventPath = fs.existsSync(eventDir) ? eventDir : null;

        // Set up the command path
        const commandDir = options.commandPath
            ? path.join(this.directoryPath, options.commandPath)
            : path.join(this.directoryPath, "commands");
        this.commandPath = fs.existsSync(commandDir) ? commandDir : null;
    }

    public load(): void {
        if (container.pluginStore.get((p: Plugin) => p.name === this.name)) {
            throw new Error(`Plugin with name ${this.name} already exists`);
        }

        // Scan the directory for events and commands and load them
        if (this.eventPath) {
            const eventFiles = this.scanDirectory(this.eventPath, ".event");
            for (const file of eventFiles) {
                const { default: EventClass, ...namedExports } = require(file);
                const ExportedEvent = EventClass || Object.values(namedExports)[0];
                if (!ExportedEvent || typeof ExportedEvent !== "function") {
                    throw new Error(`No valid event class found in ${file}`);
                }

                const instance = new ExportedEvent({ plugin: this });
                if (!(instance instanceof Event)) {
                    throw new Error(`Event ${file} does not extend the Event class`);
                }

                instance.load();
            }
        }

        // Scan the directory for commands and load them
        if (this.commandPath) {
            const commandFiles = this.scanDirectory(this.commandPath, ".command");
            for (const file of commandFiles) {
                const { default: CommandClass, ...namedExports } = require(file);
                const ExportedCommand = CommandClass || Object.values(namedExports)[0];
                if (!ExportedCommand || typeof ExportedCommand !== "function") {
                    throw new Error(`No valid command class found in ${file}`);
                }
                const instance = new ExportedCommand({ plugin: this });
                if (!(instance instanceof Command)) {
                    throw new Error(`Command ${file} does not extend the Command class`);
                }
                instance.load();
            }
        }

        container.pluginStore.add(this);
    }

    public unload(): void {
        if (!container.pluginStore.get((p: Plugin) => p.name === this.name)) {
            throw new Error(`Plugin with name ${this.name} does not exist`);
        }
        // Unload the plugin
    }

    private scanDirectory(dir: string, fileType: string): string[] {
        const exts = [".mjs", ".cjs", ".js", ".ts"];
        const files = fs.readdirSync(dir);
        let result: string[] = [];

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                result = result.concat(this.scanDirectory(filePath, fileType));
                continue;
            }

            if (exts.some((ext) => file.endsWith(`${fileType}${ext}`))) {
                result.push(filePath);
            }
        }

        return result;
    }
}

export namespace Plugin {
    export type Options = PluginOptions;
    export type BuildOptions = PluginBuildOptions;
}
