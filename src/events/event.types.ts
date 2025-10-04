import { Events } from "discord.js";
import { Plugin } from "../plugins/plugin.structure";

export interface EventOptions {
    name: Events | string;
    once?: boolean;
}

export interface EventBuildOptions {
    plugin: Plugin;
}
