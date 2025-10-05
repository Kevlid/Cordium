import { Interaction, Message } from "discord.js";
import { container } from "./container";
import { Event } from "./events/event.structure";
import { Command } from "./commands/command.structure";

export class Handler {
    constructor(handlerOptions: Handler.Options) {
        if (handlerOptions.loadMessageCommandListeners) {
            container.client.on("messageCreate", (message: Message) => this.onMessageCreate(message));
        }
        container.client.on("interactionCreate", (interaction: Interaction) => this.onInteractionCreate(interaction));
    }

    public async onEventTriggered(eventName: string, ...args: any[]): Promise<void> {
        const event: Event | null = container.eventStore.get((e: Event) => e.name === eventName) || null;
        if (event) {
            await event.run(...args);
        }
    }

    public addEventListener(eventName: string): void {
        const loadedEvents = container.store.get("loadedEvents") || new Set<string>();
        if (!loadedEvents.has(eventName)) {
            container.client.on(eventName, (...args: any[]) => this.onEventTriggered(eventName, ...args));
        }
        loadedEvents.add(eventName);
        container.store.set("loadedEvents", loadedEvents);
    }

    public async onMessageCreate(message: Message): Promise<void> {
        if (message.author.bot) return;

        const prefixes: string[] = container.core.prefixes;
        const prefix = prefixes.find((p) => message.content.startsWith(p));
        if (!prefix) return;
        const [commandName, ...args] = message.content.slice(prefix.length).trim().split(/ +/g);
        if (!commandName) return;

        var command = container.commandStore.get(
            (cmd: Command) =>
                cmd.name === commandName || (Array.isArray(cmd.aliases) && cmd.aliases.includes(commandName))
        );
        if (!command) return;

        // Check for subcommand
        const subcommandName = commandName + " " + (args[0] || "");
        if (subcommandName) {
            const subcommand = container.commandStore.get(
                (cmd: Command) =>
                    cmd.name === subcommandName || (Array.isArray(cmd.aliases) && cmd.aliases.includes(subcommandName))
            );
            if (subcommand && subcommand.runMessage) {
                command = subcommand;
            }
        }

        if (command.runMessage) {
            await command.runMessage(message, ...args);
        }
    }

    public async onInteractionCreate(interaction: Interaction): Promise<void> {
        if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) return;

        if (interaction.isChatInputCommand()) {
            const commandName = interaction.commandName;
            var command = container.commandStore.get((cmd: Command) => cmd.applicationCommands.includes(commandName));
            if (!command) return;
            if (command.runChatInput) {
                await command.runChatInput(interaction);
            }
        } else if (interaction.isContextMenuCommand()) {
            const commandName = interaction.commandName;
            var command = container.commandStore.get((cmd: Command) => cmd.applicationCommands.includes(commandName));
            if (!command) return;
            if (command.runContextMenu) {
                await command.runContextMenu(interaction);
            }
        }
    }
}

interface HandlerOptions {
    loadMessageCommandListeners?: boolean;
}

export namespace Handler {
    export type Options = HandlerOptions;
}
