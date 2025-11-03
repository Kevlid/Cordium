import type { TaskBuildOptions, TaskOptions } from "./task.types";
import type { Plugin } from "../plugins/plugin.structure";
import { container } from "../container";
import schedule, { Job } from "node-schedule";

export abstract class Task {
    /**
     * Task name
     * @type {string}
     * @example "dailyBackup"
     */
    public name: string;

    /**
     * Cron schedule for the task
     * @type {string}
     * @example "0 0 * * *"
     */
    public schedule: string;

    /**
     * The plugin instance that this task belongs to
     * @type {Plugin}
     */
    public plugin: Plugin;

    /**
     * The scheduled job instance
     * @type {Job | null}
     */
    private job: Job | null = null;

    constructor(buildOptions: Task.BuildOptions, options: Task.Options) {
        this.name = options.name;
        this.schedule = options.schedule;
        this.plugin = buildOptions.plugin;
    }

    public load(): void {
        if (container.taskStore.get((t: Task) => t.name === this.name && t.plugin.name === this.plugin.name)) {
            throw new Error(`Task with name ${this.name} already exists in plugin ${this.plugin.name}`);
        }
        this.job = schedule.scheduleJob(this.schedule, () => this.run());
        container.taskStore.add(this);
    }

    public unload(): void {
        if (!container.taskStore.get((t: Task) => t.name === this.name && t.plugin.name === this.plugin.name)) {
            throw new Error(`Task with name ${this.name} does not exist in plugin ${this.plugin.name}`);
        }
        if (this.job) {
            this.job.cancel();
            this.job = null;
        }
        container.taskStore.remove((t: Task) => t.name === this.name && t.plugin.name === this.plugin.name);
    }

    public abstract run(...args: any[]): Promise<void> | void;
}

export namespace Task {
    export type Options = TaskOptions;
    export type BuildOptions = TaskBuildOptions;
}
