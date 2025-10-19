import { Plugin } from "../plugins/plugin.structure";

export interface CommandOptions {
    name: string;
    description?: string;
    aliases?: Array<string>;
    arguments?: Array<CommandArgument>;
    values?: Record<string, any>;
}

export interface CommandArgument {
    name: string;
    type: ArgumentTypes;
    required?: boolean;
    default?: string | number | boolean;
    rest?: boolean;
}

export enum ArgumentTypes {
    String = "string",
    Number = "number",
    Boolean = "boolean",
    User = "user",
    Member = "member",
    Channel = "channel",
    Role = "role",
}

export interface CommandBuildOptions {
    plugin: Plugin;
}
