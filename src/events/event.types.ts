import { Events } from "discord.js";
import { Plugin } from "../plugins/plugin.structure";

export interface EventOptions {
    name: EventScopes;
    once?: boolean;
}

export interface EventBuildOptions {
    plugin: Plugin;
}

export enum EventScopes {
    MessageCreate = Events.MessageCreate,
    MessageDelete = Events.MessageDelete,
    MessageUpdate = Events.MessageUpdate,
}
