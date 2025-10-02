import { Core } from "../core";
import { ApplicationIntegrationType, SlashCommandBuilder } from "discord.js";
import { SlashCommandData } from "./slash.types";

export class SlashBuilder {
    private core: Core;
    private globalCommands = new Map<string, Set<SlashCommandBuilder>>();
    private guildCommands = new Map<string, Set<SlashCommandBuilder>>();

    constructor(core: Core) {
        this.core = core;
    }

    private build(command: SlashCommandData): SlashCommandBuilder {
        const builder = new SlashCommandBuilder()
            .setName(command.name)
            .setDescription(command.description || "No description")
            .setDefaultMemberPermissions(command.defaultMemberPermissions || null)
            .setIntegrationTypes(...(command.integrationTypes || [ApplicationIntegrationType.GuildInstall]))
            .setContexts(...command.contexts)
            .setNSFW(command.nsfw || false);
        return builder;
    }

    public buildGlobal(command: SlashCommandData): void {
        // Check if a command with the same name already exists in the set
        const allGlobalBuilders = new Set<SlashCommandBuilder>();
        for (const builders of this.globalCommands.values()) {
            builders.forEach((builder) => allGlobalBuilders.add(builder));
        }
        for (const oldBuilder of allGlobalBuilders) {
            if (oldBuilder.name === command.name) {
                throw new Error(`Global command with name ${command.name} already exists`);
            }
        }
        const builder = this.build(command);

        // Updates it based on plugin
        let set = this.globalCommands.get(command.pluginName);
        if (!set) {
            set = new Set<SlashCommandBuilder>();
            this.globalCommands.set(command.pluginName, set);
        }
        set.add(builder);
    }

    public getGlobal(pluginName: string): Array<SlashCommandBuilder> {
        return Array.from(this.globalCommands.get(pluginName) || []);
    }

    public buildGuild(command: SlashCommandData): void {
        // Check if a command with the same name already exists in the set
        const allGuildBuilders = new Set<SlashCommandBuilder>();
        for (const builders of this.guildCommands.values()) {
            builders.forEach((builder) => allGuildBuilders.add(builder));
        }
        for (const oldBuilder of allGuildBuilders) {
            if (oldBuilder.name === command.name) {
                throw new Error(`Guild command with name ${command.name} already exists`);
            }
        }
        const builder = this.build(command);

        // Updates it based on plugin
        let set = this.guildCommands.get(command.pluginName);
        if (!set) {
            set = new Set<SlashCommandBuilder>();
            this.guildCommands.set(command.pluginName, set);
        }
        set.add(builder);
    }

    public getGuild(pluginName: string): Array<SlashCommandBuilder> {
        return Array.from(this.guildCommands.get(pluginName) || []);
    }
}
