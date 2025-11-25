import { PermissionResolvable } from "discord.js";
import { Plugin } from "../plugins/plugin.structure";

export interface CommandOptions {
    name: string;
    description?: string;
    aliases?: Array<string>;
    arguments?: Array<CommandArgument>;
    guildOnly?: boolean;
    botPermissions?: Array<PermissionResolvable>;
    values?: Record<string, any>;
}

export interface CommandArgument {
    type: ArgumentTypes;
    required?: boolean;
    default?: string | number | boolean | Date;
}

export enum ArgumentTypes {
    String = "string",
    Number = "number",
    Boolean = "boolean",
    User = "user",
    Member = "member",
    Channel = "channel",
    Role = "role",
    Date = "date",
    Text = "text",
}

export interface CommandBuildOptions {
    plugin: Plugin;
}
