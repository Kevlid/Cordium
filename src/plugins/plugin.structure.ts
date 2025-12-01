import type { PluginBuildOptions, PluginOptions } from "./plugin.types";
import { Event } from "../events/event.structure";
import { Command } from "../commands/command.structure";
import { Pager } from "../pager/pager.structure";
import { Task } from "../tasks/task.structure";
import { container } from "../container";
import { pathToFileURL } from "url";
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

    /**
     * The path to the pager directory
     * @type {string}
     */
    public pagerPath: string | null = null;

    /**
     * The path to the task directory
     * @type {string}
     */
    public taskPath: string | null = null;

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

        // Set up the pager path
        const pagerDir = options.pagerPath
            ? path.join(this.directoryPath, options.pagerPath)
            : path.join(this.directoryPath, "pagers");
        this.pagerPath = fs.existsSync(pagerDir) ? pagerDir : null;

        // Set up the task path
        const taskDir = options.taskPath
            ? path.join(this.directoryPath, options.taskPath)
            : path.join(this.directoryPath, "tasks");
        this.taskPath = fs.existsSync(taskDir) ? taskDir : null;
    }

    public async load(): Promise<void> {
        if (container.pluginStore.get((p: Plugin) => p.name === this.name)) {
            throw new Error(`Plugin with name ${this.name} already exists`);
        }

        // Scan the directory for events and commands and load them
        if (this.eventPath) {
            const eventFiles = this.scanDirectory(this.eventPath, ".event");
            for (const file of eventFiles) {
                let imported;
                try {
                    const eventUrl = pathToFileURL(path.resolve(file)).href;
                    imported = await import(eventUrl);
                } catch (err) {
                    imported = require(path.resolve(file));
                }
                const ExportedEvent = imported.default || Object.values(imported)[0];
                const EventClass =
                    typeof ExportedEvent === "function"
                        ? ExportedEvent
                        : Object.values(imported).find((v) => typeof v === "function" && v.prototype instanceof Event);

                if (!EventClass) {
                    throw new Error(`No valid event class found in ${file}`);
                }

                const instance = new EventClass({ plugin: this });
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
                let imported;
                try {
                    const commandUrl = pathToFileURL(path.resolve(file)).href;
                    imported = await import(commandUrl);
                } catch (err) {
                    imported = require(path.resolve(file));
                }
                const ExportedCommand = imported.default || Object.values(imported)[0];
                const CommandClass =
                    typeof ExportedCommand === "function"
                        ? ExportedCommand
                        : Object.values(imported).find(
                              (v) => typeof v === "function" && v.prototype instanceof Command
                          );
                if (!CommandClass) {
                    throw new Error(`No valid command class found in ${file}`);
                }
                const instance = new CommandClass({ plugin: this });
                if (!(instance instanceof Command)) {
                    throw new Error(`Command ${file} does not extend the Command class`);
                }
                instance.load();
            }
        }

        // Scan the directory for pagers and load them
        if (this.pagerPath) {
            const pagerFiles = this.scanDirectory(this.pagerPath, ".pager");
            for (const file of pagerFiles) {
                let imported;
                try {
                    const pagerUrl = pathToFileURL(path.resolve(file)).href;
                    imported = await import(pagerUrl);
                } catch (err) {
                    imported = require(path.resolve(file));
                }
                const ExportedPager = imported.default || Object.values(imported)[0];
                const PagerClass =
                    typeof ExportedPager === "function"
                        ? ExportedPager
                        : Object.values(imported).find((v) => typeof v === "function" && v.prototype instanceof Pager);
                if (!PagerClass) {
                    throw new Error(`No valid pager class found in ${file}`);
                }
                const instance = new PagerClass({ plugin: this });
                if (!(instance instanceof Pager)) {
                    throw new Error(`Pager ${file} does not extend the Pager class`);
                }
                instance.load();
            }
        }

        // Scan the directory for tasks and load them
        if (this.taskPath) {
            const taskFiles = this.scanDirectory(this.taskPath, ".task");
            for (const file of taskFiles) {
                let imported;
                try {
                    const taskUrl = pathToFileURL(path.resolve(file)).href;
                    imported = await import(taskUrl);
                } catch (err) {
                    imported = require(path.resolve(file));
                }
                const ExportedTask = imported.default || Object.values(imported)[0];
                const TaskClass =
                    typeof ExportedTask === "function"
                        ? ExportedTask
                        : Object.values(imported).find((v) => typeof v === "function" && v.prototype instanceof Task);

                if (!TaskClass) {
                    throw new Error(`No valid task class found in ${file}`);
                }

                const instance = new TaskClass({ plugin: this });
                if (!(instance instanceof Task)) {
                    throw new Error(`Task ${file} does not extend the Task class`);
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
        container.pluginStore.remove((p: Plugin) => p.name === this.name);

        const eventsToUnload = container.eventStore.filter((e: Event) => e.plugin.name === this.name);
        eventsToUnload.forEach((event) => event.unload());

        const commandsToUnload = container.commandStore.filter((cmd: Command) => cmd.plugin.name === this.name);
        commandsToUnload.forEach((cmd) => cmd.unload());

        const tasksToUnload = container.taskStore.filter((t: Task) => t.plugin.name === this.name);
        tasksToUnload.forEach((task) => task.unload());
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
