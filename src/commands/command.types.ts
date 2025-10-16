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
}

export enum ArgumentTypes {
    String = "string",
    Number = "number",
    Boolean = "boolean",
    User = "user",
}

export interface CommandBuildOptions {
    plugin: Plugin;
}
