import { Core } from "../core";
import { ApplicationIntegrationType, ContextMenuCommandBuilder } from "discord.js";
import { ContextMenuCommandData } from "./contextMenu.types";

export class ContextMenuBuilder {
    private core: Core;
    private globalCommands = new Map<string, Set<ContextMenuCommandBuilder>>();
    private guildCommands = new Map<string, Set<ContextMenuCommandBuilder>>();

    constructor(core: Core) {
        this.core = core;
    }

    private build(command: ContextMenuCommandData): ContextMenuCommandBuilder {
        const builder = new ContextMenuCommandBuilder()
            .setName(command.name)
            .setDefaultMemberPermissions(command.defaultMemberPermissions || null)
            .setIntegrationTypes(...(command.integrationTypes || [ApplicationIntegrationType.GuildInstall]))
            .setContexts(...command.contexts)
            .setType(command.type);
        return builder;
    }

    public buildGlobal(command: ContextMenuCommandData): void {
        // Check if a command with the same name already exists in the set
        const allGlobalBuilders = new Set<ContextMenuCommandBuilder>();
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
            set = new Set<ContextMenuCommandBuilder>();
            this.globalCommands.set(command.pluginName, set);
        }
        set.add(builder);
    }

    public getGlobal(pluginName: string): Array<ContextMenuCommandBuilder> {
        return Array.from(this.globalCommands.get(pluginName) || []);
    }

    public buildGuild(command: ContextMenuCommandData): void {
        // Check if a command with the same name already exists in the set
        const allGuildBuilders = new Set<ContextMenuCommandBuilder>();
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
            set = new Set<ContextMenuCommandBuilder>();
            this.guildCommands.set(command.pluginName, set);
        }
        set.add(builder);
    }

    public getGuild(pluginName: string): Array<ContextMenuCommandBuilder> {
        return Array.from(this.guildCommands.get(pluginName) || []);
    }
}
