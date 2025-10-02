import type { Core } from "../core";
import { EventData, EventScopes } from "./event.types";

export class EventManager {
    private core: Core;
    private events = new Map<string, EventData>();

    constructor(core: Core) {
        this.core = core;
        for (const scope in EventScopes) {
            this.core.client.on(scope, (...args: any[]) => this.onEvent.call(this, scope, ...args));
        }
    }

    private async onEvent(eventName: string, ...args: any[]): Promise<void> {
        const loadedEvents: EventData[] = [...this.events.values()].filter((event) => event.name === eventName);
        const guildId = args[0]?.guild?.id;

        for (const event of loadedEvents) {
            if (guildId && !(await this.core.config.isPluginEnabled?.(event.pluginName, guildId))) {
                continue;
            }
            const pluginData = await this.core.pluginManager.getPluginData();
            await event.execute(pluginData, ...args);
        }
    }

    public load(event: EventData): void {
        const eventId = `${event.pluginName}:${event.name}`;
        if (this.events.has(eventId)) {
            throw new Error(`Global event with id ${eventId} is already registered`);
        }
        this.events.set(eventId, event);
    }

    public unload(eventId: string): void {
        if (!this.events.has(eventId)) {
            throw new Error(`Global event with id ${eventId} is not registered`);
        }
        this.events.delete(eventId);
    }
}
