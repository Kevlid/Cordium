import { Events } from "discord.js";
import { PluginData } from "../plugins/plugin.types";

export interface Event {
    name: EventScopes;
    once?: boolean;
    execute: (pluginData: PluginData, ...args: any[]) => Promise<void> | void;
}

export interface EventData extends Event {
    pluginName: string;
}

export enum EventScopes {
    MessageCreate = Events.MessageCreate,
    MessageDelete = Events.MessageDelete,
    MessageUpdate = Events.MessageUpdate,
}
