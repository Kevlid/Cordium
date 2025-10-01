import { PluginData } from "../plugins/plugin.types";
import {
    ApplicationCommandOptionType,
    AutocompleteInteraction,
    ChannelType,
    ChatInputCommandInteraction,
} from "discord.js";

export interface SlashCommand {
    name: string;
    description?: string;
    options?: any[];
    defaultmemberPermissions?: string;
    autocomplete?: (
        pluginData: PluginData,
        commandData: any,
        interaction: AutocompleteInteraction
    ) => Promise<void> | void;
    execute: (
        pluginData: PluginData,
        commandData: any,
        interaction: ChatInputCommandInteraction
    ) => Promise<void> | void;
}

export interface SlashCommandOption {
    type: ApplicationCommandOptionType;
    name: string;
    description: string;
    required?: boolean;
    choices?: Array<{ name: string; value: string | number }>;
    channelTypes?: ChannelType[];
    minValue?: number;
    maxValue?: number;
    minLength?: number;
    maxLength?: number;
    autocomplete?: boolean;
}
