import type { Core } from "../core";
import { EventData, EventScopes } from "./event.types";

export class EventManager {
    private core: Core;
    private globalEvents = new Map<string, EventData>();
    private guildEvents = new Map<string, EventData>();
    private loadedGlobalEvents = new Set<string>();
    private loadedGuildEvents = new Map<string, Set<string>>();

    constructor(core: Core) {
        this.core = core;
        for (const scope in EventScopes) {
            this.core.client.on(scope, (...args: any[]) => this.onEvent.call(this, scope, ...args));
        }
    }

    private async onEvent(eventName: string, ...args: any[]): Promise<void> {
        const loadedGlobalEventIds = [...this.loadedGlobalEvents];
        const loadedGlobalEvents: EventData[] = loadedGlobalEventIds
            .map((id) => this.globalEvents.get(id))
            .filter((event): event is EventData => event !== undefined && event.name === eventName);

        const guildId = args[0]?.guild?.id;
        const loadedGuildEventIds = guildId ? [...(this.loadedGuildEvents.get(guildId) || [])] : [];
        const loadedGuildEvents: EventData[] = loadedGuildEventIds
            .map((id) => this.guildEvents.get(id))
            .filter((event): event is EventData => event !== undefined && event.name === eventName);

        for (const event of [...loadedGlobalEvents, ...loadedGuildEvents]) {
            const pluginData = await this.core.pluginManager.getPluginData();
            await event.execute(pluginData, ...args);
        }
    }

    public registerGlobal(event: EventData): void {
        if (this.globalEvents.has(event.name)) {
            throw new Error(`Global event with name ${event.name} is already registered`);
        }
        this.globalEvents.set(`${event.pluginName}:${event.name}`, event);
    }

    public loadGlobal(eventId: string): void {
        const event = this.globalEvents.get(eventId);
        if (!event) {
            throw new Error(`Global event with id ${eventId} is not registered`);
        }
        if (this.loadedGlobalEvents.has(eventId)) {
            throw new Error(`Global event with id ${eventId} is already loaded`);
        }
        this.loadedGlobalEvents.add(eventId);
    }

    public unloadGlobal(eventId: string): void {
        const event = this.globalEvents.get(eventId);
        if (!event) {
            throw new Error(`Global event with id ${eventId} is not registered`);
        }
        if (!this.loadedGlobalEvents.has(eventId)) {
            throw new Error(`Global event with id ${eventId} is not loaded`);
        }
        this.loadedGlobalEvents.delete(eventId);
    }

    public registerGuild(event: EventData): void {
        if (this.guildEvents.has(event.name)) {
            throw new Error(`Guild event with name ${event.name} is already registered`);
        }
        this.guildEvents.set(`${event.pluginName}:${event.name}`, event);
    }

    public loadGuild(guildId: string, eventId: string): void {
        const event = this.guildEvents.get(eventId);
        if (!event) {
            throw new Error(`Guild event with id ${eventId} is not registered`);
        }
        const loadedEvents = this.loadedGuildEvents.get(guildId) || new Set<string>();
        if (loadedEvents.has(eventId)) {
            throw new Error(`Guild event with id ${eventId} is already loaded in guild ${guildId}`);
        }
        loadedEvents.add(eventId);
        this.loadedGuildEvents.set(guildId, loadedEvents);
    }

    public unloadGuild(guildId: string, eventId: string): void {
        const event = this.guildEvents.get(eventId);
        if (!event) {
            throw new Error(`Guild event with id ${eventId} is not registered`);
        }
        const loadedEvents = this.loadedGuildEvents.get(guildId);
        if (!loadedEvents || !loadedEvents.has(eventId)) {
            throw new Error(`Guild event with id ${eventId} is not loaded in guild ${guildId}`);
        }
        loadedEvents.delete(eventId);
        this.loadedGuildEvents.set(guildId, loadedEvents);
    }
}
