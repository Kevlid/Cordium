import { Plugin } from "./plugin.structure";

class PluginStore extends Set<Plugin> {
    constructor() {
        super();
    }

    public get(name: string): Plugin | null {
        for (const plugin of this) {
            if (plugin.name === name) {
                return plugin;
            }
        }
        return null;
    }
}

export const pluginStore = new PluginStore();
