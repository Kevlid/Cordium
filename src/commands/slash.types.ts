import { PluginData } from "../plugins/plugin.types";
import {
    ApplicationCommandOptionType,
    ApplicationIntegrationType,
    AutocompleteInteraction,
    ChannelType,
    ChatInputCommandInteraction,
    InteractionContextType,
    PermissionResolvable,
} from "discord.js";

export interface SlashCommand {
    name: string;
    description?: string;
    options?: SlashCommandOption[];
    defaultMemberPermissions?: bigint | null;
    integrationTypes?: ApplicationIntegrationType[];
    contexts: InteractionContextType[];
    nsfw?: boolean;
    autocomplete?: (pluginData: PluginData, interaction: AutocompleteInteraction) => Promise<void> | void;
    execute: (pluginData: PluginData, interaction: ChatInputCommandInteraction) => Promise<void> | void;
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

export interface SlashCommandData extends SlashCommand {
    pluginName: string;
}
