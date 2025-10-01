import { PrefixCommand } from "./prefix.types";
import { SlashCommand } from "./command.types";

export function createPrefixCommand(command: PrefixCommand): PrefixCommand {
    return command;
}

export function createSlashCommand(command: SlashCommand): SlashCommand {
    return command;
}
