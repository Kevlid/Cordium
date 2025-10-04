import { EventBuildOptions, EventOptions, EventScopes } from "./event.types";
import { eventStore } from "./event.store";
import { Plugin } from "../plugins/plugin.structure";

export class Event {
    /**
     * Event name
     * @type {EventScopes}
     * @example "My Event"
     */
    public name: EventScopes;

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
        if (eventStore.get(this.name)) {
            throw new Error(`Event with name ${this.name} already exists`);
        }
        // Load the event
    }

    public unload(): void {
        if (!eventStore.get(this.name)) {
            throw new Error(`Event with name ${this.name} does not exist`);
        }
        // Unload the event
    }
}

export namespace Event {
    export type Options = EventOptions;
    export type BuildOptions = EventBuildOptions;
}
