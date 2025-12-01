import { Plugin } from "../plugins/plugin.structure";

export interface TaskOptions {
    name: string;
    schedule: string;
}

export interface TaskBuildOptions {
    plugin: Plugin;
}
