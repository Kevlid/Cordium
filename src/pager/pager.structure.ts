import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    type ChatInputCommandInteraction,
    type Message,
    type MessageComponentInteraction,
} from "discord.js";
import type { Plugin } from "../plugins/plugin.structure";
import { container } from "../container";
import { PagerBuildOptions, PagerOptions } from "./pager.types";

export abstract class Pager {
    /**
     * The plugin instance that this pager belongs to
     * @type {Plugin}
     */
    public plugin: Plugin;

    /**
     * The id of the pager
     * @type {string}
     * @example "levelingLeaderboard"
     */
    public id: string;

    /**
     * The prefix for all the custom ids
     * @type {string}
     */
    public prefix: string;

    constructor(buildOptions: Pager.BuildOptions, options: Pager.Options) {
        this.plugin = buildOptions.plugin;
        this.id = options.id;
        this.prefix = `@pager:/${this.id}`;
    }

    public load(): void {
        if (container.pagerStore.get((p: Pager) => p.id === this.id && p.plugin.name === this.plugin.name)) {
            throw new Error(`Pager with id ${this.id} already exists`);
        }
        container.pagerStore.add(this);
    }

    public unload(): void {
        if (!container.pagerStore.get((p: Pager) => p.id === this.id)) {
            throw new Error(`Pager with id ${this.id} does not exist`);
        }
        container.pagerStore.remove((p: Pager) => p.id === this.id);
    }

    public getActionRow(page = 1, lastPage?: boolean) {
        const firstButton = new ButtonBuilder()
            .setCustomId(`${this.prefix}:prevjump:${page}`)
            .setEmoji("⏪")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page <= 1);

        const previousButton = new ButtonBuilder()
            .setCustomId(`${this.prefix}:prev:${page}`)
            .setEmoji("◀️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page <= 1);

        const middleButton = new ButtonBuilder()
            .setCustomId(`${this.prefix}:none`)
            .setLabel("\u200b")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);

        const nextButton = new ButtonBuilder()
            .setCustomId(`${this.prefix}:next:${page}`)
            .setEmoji("▶️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(!!lastPage);

        const lastButton = new ButtonBuilder()
            .setCustomId(`${this.prefix}:nextjump:${page}`)
            .setEmoji("⏭️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(!!lastPage);

        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            firstButton,
            previousButton,
            middleButton,
            nextButton,
            lastButton
        );
        return actionRow;
    }

    addActionRowToRender(rendered: any, page = 1, lastPage?: boolean) {
        const actionRow = this.getActionRow(page, lastPage);

        if (!rendered.components) {
            rendered.components = [];
        }

        const hasActionRow = rendered.components.some((component: any) => {
            const components = component.components || [];
            return components.some((btn: any) => btn.data?.custom_id?.startsWith(this.prefix));
        });

        if (!hasActionRow) {
            rendered.components.push(actionRow);
        }

        return rendered;
    }

    public render?(source: Pager.Source, page: number): Promise<any> | any;
}

export namespace Pager {
    export type Options = PagerOptions;
    export type BuildOptions = PagerBuildOptions;
    export type Source = Message | ChatInputCommandInteraction | MessageComponentInteraction;
}
