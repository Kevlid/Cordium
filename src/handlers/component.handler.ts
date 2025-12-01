import { Interaction, MessageComponentInteraction } from "discord.js";
import type { Pager } from "../pager/pager.structure";
import { container } from "../container";

export class ComponentHandler {
    constructor() {
        container.client.on("interactionCreate", (interaction: Interaction) => {
            if (interaction.isMessageComponent()) {
                this.onInteraction(interaction);
            }
        });
    }

    async onInteraction(interaction: MessageComponentInteraction) {
        const [module, componentId] = interaction.customId.split(":/");

        switch (module) {
            case "@pager":
                await this.handlePagerInteraction(interaction, componentId);
                break;
        }
    }

    async handlePagerInteraction(interaction: MessageComponentInteraction, componentId: string) {
        const [pagerId, action, current] = componentId.split(":");
        const pager = container.pagerStore.get((p) => p.id === pagerId);
        let currentPage = parseInt(current, 10);

        if (isNaN(currentPage) || currentPage < 1) {
            currentPage = 1;
        }

        if (!pager) {
            await interaction.reply({ content: "Pager not found", ephemeral: true });
            return;
        }

        if (!pager.render) {
            await interaction.reply({ content: "Pager render method not implemented", ephemeral: true });
            return;
        }

        let newPage = currentPage;
        let rendered = null;

        try {
            if (action === "prevjump") {
                newPage = Math.max(1, currentPage - 10);
                rendered = await pager.render(interaction, newPage);
            } else if (action === "prev") {
                newPage = Math.max(1, currentPage - 1);
                rendered = await pager.render(interaction, newPage);
            } else if (action === "next") {
                newPage = currentPage + 1;
                rendered = await pager.render(interaction, newPage);
            } else if (action === "nextjump") {
                for (let offset = 10; offset >= 1; offset--) {
                    const page = currentPage + offset;
                    try {
                        const result = await pager.render(interaction, page);
                        if (result) {
                            newPage = page;
                            rendered = result;
                            break;
                        }
                    } catch (error) {
                        continue;
                    }
                }

                if (!rendered) {
                    newPage = currentPage + 1;
                }
            }
        } catch (error) {}

        try {
            if (!rendered) {
                console.log("Rendered:", rendered);
                await interaction.reply({ content: "Failed to fetch pager data", ephemeral: true });
                return;
            }
            let nextRender = await pager.render(interaction, newPage + 1);
            rendered = pager.addActionRowToRender(rendered, newPage, !nextRender);
            await interaction.update(rendered);
        } catch (error) {
            await interaction.reply({ content: "Failed to render pager", ephemeral: true });
        }
    }
}
