import { Plugin } from "../plugins/plugin.structure";

export interface CommandOptions {
    name: string;
    description?: string;
    aliases?: Array<string>;
    values?: Record<string, any>;
}

export interface CommandBuildOptions {
    plugin: Plugin;
}
