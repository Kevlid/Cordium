import type { Client, ContextMenuCommandBuilder, SlashCommandBuilder } from "discord.js";
import type { Core } from "./core";
import type { Plugin } from "./plugins/plugin.structure";
import type { Event } from "./events/event.structure";
import type { Command } from "./commands/command.structure";
import type { Task } from "./tasks/task.structure";
import { StoreSet, StoreMap } from "./store";

export class Container {
    public core!: Core;
    public client!: Client;
    public store = new StoreMap<string, any>();
    public pluginStore = new StoreSet<Plugin>();
    public eventStore = new StoreSet<Event>();
    public commandStore = new StoreSet<Command>();
    public commandBuilderStore = new StoreSet<SlashCommandBuilder | ContextMenuCommandBuilder>();
    public taskStore = new StoreSet<Task>();
}

const CONTAINER_KEY = Symbol.for("cordium.container");
function getContainer(): Container {
    const globalThis = global as any;
    if (!globalThis[CONTAINER_KEY]) {
        globalThis[CONTAINER_KEY] = new Container();
    }
    return globalThis[CONTAINER_KEY];
}

export const container = getContainer();
