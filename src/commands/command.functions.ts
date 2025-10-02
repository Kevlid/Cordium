import { PermissionFlagsBits } from "discord.js";
import { PrefixCommand } from "./prefix.types";
import { SlashCommand } from "./slash.types";

export function createPrefixCommand(command: PrefixCommand): PrefixCommand {
    return command;
}

export function createSlashCommand(command: SlashCommand): SlashCommand {
    return command;
}
