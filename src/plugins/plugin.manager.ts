import type { Core } from "../core";
import { Plugin, PluginData } from "./plugin.types";

export class PluginManager {
    private core: Core;
    private plugins = new Map<string, Plugin>();

    constructor(core: Core) {
        this.core = core;
    }

    public getPluginData(): PluginData {
        return {
            core: this.core,
            client: this.core.client,
        };
    }

    public load(plugin: Plugin): void {
        if (this.plugins.has(plugin.name)) {
            throw new Error(`Plugin with name ${plugin.name} is already registered`);
        }
        // Load events
        for (const event of plugin?.events || []) {
            const eventData = { ...event, pluginName: plugin.name };
            this.core.eventManager.load(eventData);
        }

        // Load prefix commands
        for (const command of plugin?.prefixCommands || []) {
            const commandData = { ...command, pluginName: plugin.name };
            this.core.commandManager.prefixHandler.load(commandData);
        }

        // Add the plugin to the map
        this.plugins.set(plugin.name, plugin);
    }
}
