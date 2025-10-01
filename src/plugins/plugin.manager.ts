import type { Core } from "../core";
import { Plugin, PluginData } from "./plugin.types";

export class PluginManager {
    private core: Core;
    private globalPlugins = new Map<string, Plugin>();
    private guildPlugins = new Map<string, Plugin>();
    private loadedGlobalPlugins = new Set<string>();
    private loadedGuildPlugins = new Map<string, Set<string>>();

    constructor(core: Core) {
        this.core = core;
    }

    public getPluginData(): PluginData {
        return {
            core: this.core,
            client: this.core.client,
        };
    }

    public registerGlobal(plugin: Plugin): void {
        if (this.globalPlugins.has(plugin.name)) {
            throw new Error(`Global plugin with name ${plugin.name} is already registered`);
        }
        // Register events
        for (const event of plugin?.events || []) {
            const eventData = { ...event, pluginName: plugin.name };
            this.core.eventManager.registerGlobal(eventData);
        }

        // Add the plugin to the map
        this.globalPlugins.set(plugin.name, plugin);
    }

    public loadGlobal(pluginName: string): void {
        const plugin = this.globalPlugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Global plugin with name ${pluginName} is not registered`);
        }
        if (this.loadedGlobalPlugins.has(pluginName)) {
            throw new Error(`Global plugin with name ${pluginName} is already loaded`);
        }

        // Load events
        for (const event of plugin?.events || []) {
            this.core.eventManager.loadGlobal(`${pluginName}:${event.name}`);
        }

        // Add the plugin to the set
        this.loadedGlobalPlugins.add(pluginName);
    }

    public unloadGlobal(pluginName: string): void {
        const plugin = this.globalPlugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Global plugin with name ${pluginName} is not registered`);
        }
        if (!this.loadedGlobalPlugins.has(pluginName)) {
            throw new Error(`Global plugin with name ${pluginName} is not loaded`);
        }

        // Unload events
        for (const event of plugin?.events || []) {
            this.core.eventManager.unloadGlobal(`${pluginName}:${event.name}`);
        }

        // Remove the plugin from the set
        this.loadedGlobalPlugins.delete(pluginName);
    }

    public registerGuild(plugin: Plugin): void {
        if (this.guildPlugins.has(plugin.name)) {
            throw new Error(`Guild plugin with name ${plugin.name} is already registered`);
        }

        // Register events
        for (const event of plugin?.events || []) {
            const eventData = { ...event, pluginName: plugin.name };
            this.core.eventManager.registerGuild(eventData);
        }

        // Add the plugin to the map
        this.guildPlugins.set(plugin.name, plugin);
    }

    public loadGuild(pluginName: string, guildId: string): void {
        const plugin = this.guildPlugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Guild plugin with name ${pluginName} is not registered`);
        }
        const loadedPlugins = this.loadedGuildPlugins.get(guildId) || new Set<string>();
        if (loadedPlugins.has(pluginName)) {
            throw new Error(`Guild plugin with name ${pluginName} is already loaded in guild ${guildId}`);
        }

        // Load events
        for (const event of plugin?.events || []) {
            this.core.eventManager.loadGuild(guildId, `${pluginName}:${event.name}`);
        }

        // Add the plugin to the set
        loadedPlugins.add(pluginName);
        this.loadedGuildPlugins.set(guildId, loadedPlugins);
    }

    public unloadGuild(pluginName: string, guildId: string): void {
        const plugin = this.guildPlugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Guild plugin with name ${pluginName} is not registered`);
        }
        const loadedPlugins = this.loadedGuildPlugins.get(guildId);
        if (!loadedPlugins || !loadedPlugins.has(pluginName)) {
            throw new Error(`Guild plugin with name ${pluginName} is not loaded in guild ${guildId}`);
        }

        // Unload events
        for (const event of plugin?.events || []) {
            this.core.eventManager.unloadGuild(guildId, `${pluginName}:${event.name}`);
        }

        // Remove the plugin from the set
        loadedPlugins.delete(pluginName);
        this.loadedGuildPlugins.set(guildId, loadedPlugins);
    }
}
