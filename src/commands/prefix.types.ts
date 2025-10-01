import { PluginData } from "../plugins/plugin.types";

export interface PrefixCommand {
    name: string;
    description?: string;
    aliases?: string[];
    execute: (pluginData: PluginData, commandData: any, ...args: any[]) => Promise<void> | void;
}

export interface PrefixCommandData extends PrefixCommand {
    pluginName: string;
}
