import {
    ApplicationIntegrationType,
    ContextMenuCommandInteraction,
    ContextMenuCommandType,
    InteractionContextType,
} from "discord.js";
import { PluginData } from "../plugins/plugin.types";

export interface ContextMenuCommand {
    name: string;
    defaultMemberPermissions?: bigint | null;
    integrationTypes?: ApplicationIntegrationType[];
    contexts: InteractionContextType[];
    type: ContextMenuCommandType;
    execute: (pluginData: PluginData, interaction: ContextMenuCommandInteraction) => Promise<void> | void;
}

export interface ContextMenuCommandData extends ContextMenuCommand {
    pluginName: string;
}
