import { Plugin } from "./plugins/plugin.types";

export interface CordiumOptions {
    prefix?: Array<string> | string;
    owners?: Array<string> | string;
    plugins?: Array<Plugin>;
    isPluginEnabled?: (pluginName: string, guildId: string) => boolean | Promise<boolean>;
}

export interface Author {
    username: string;
    id: string;
}
