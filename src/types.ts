import { Plugin } from "./plugins/plugin.types";

export interface CordiumOptions {
    prefix: Array<string> | string;
    owners: Array<string> | string;
    globalPlugins: Array<Plugin>;
    guildPlugins: Array<Plugin>;
}

export interface Author {
    username: string;
    id: string;
}
