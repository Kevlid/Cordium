import type { Client } from "discord.js";
import type { Core } from "../core";
import { Author } from "../types";
import { Event } from "../events/event.types";

export interface Plugin {
    name: string;
    authors: Array<Author>;
    events?: Array<Event>;
    prefixCommands?: Array<any>;
    onLoad: (pluginData: PluginData) => Promise<void>;
    onUnload: (pluginData: PluginData) => Promise<void>;
}

export interface PluginData {
    core: Core;
    client: Client;
}
