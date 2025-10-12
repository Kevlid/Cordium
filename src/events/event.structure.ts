import type { Events } from "discord.js";
import type { EventBuildOptions, EventOptions } from "./event.types";
import type { Plugin } from "../plugins/plugin.structure";
import { container } from "../container";

export abstract class Event {
    /**
     * Event name
     * @type {Events | string}
     * @example "messageCreate"
     */
    public name: Events | string;

    /**
     * If the event should be executed only once
     * @type {boolean}
     * @example true
     * @default false
     */
    public once: boolean;

    /**
     * The plugin instance that this event belongs to
     * @type {Plugin}
     */
    public plugin: Plugin;

    constructor(buildOptions: Event.BuildOptions, options: Event.Options) {
        this.name = options.name;
        this.once = options.once || false;
        this.plugin = buildOptions.plugin;
    }

    public load(): void {
        if (container.eventStore.get((e: Event) => e.name === this.name && e.plugin.name === this.plugin.name)) {
            throw new Error(`Event with name ${this.name} already exists in plugin ${this.plugin.name}`);
        }
        container.eventStore.add(this);
        container.core.handler.addEventListener(this.name);
    }

    public unload(): void {
        if (!container.eventStore.get((e: Event) => e.name === this.name && e.plugin.name === this.plugin.name)) {
            throw new Error(`Event with name ${this.name} does not exist in plugin ${this.plugin.name}`);
        }
        // Unload the event
    }

    public abstract run(...args: any[]): Promise<void> | void;
}

export namespace Event {
    export type Options = EventOptions;
    export type BuildOptions = EventBuildOptions;
}
