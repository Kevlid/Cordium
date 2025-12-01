import { Events, PermissionResolvable } from "discord.js";
import { Plugin } from "../plugins/plugin.structure";

export interface EventOptions {
    name: Events | string;
    once?: boolean;
    botPermissions?: Array<PermissionResolvable>;
}

export interface EventBuildOptions {
    plugin: Plugin;
}
