import { Plugin } from "../plugins/plugin.structure";

export interface CommandOptions {
    name: string;
    description?: string;
    aliases?: Array<string>;
}

export interface CommandBuildOptions {
    plugin: Plugin;
}
