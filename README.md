<div align="center">
  <h1>🔥 Cordium</h1>
  <p><em>A simple but powerful Discord framework</em></p>
  
  [![NPM Version](https://img.shields.io/npm/v/cordium?style=for-the-badge&color=blue)](https://www.npmjs.com/package/cordium)
  [![License](https://img.shields.io/npm/l/cordium?style=for-the-badge&color=green)](LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord)](https://discord.js.org/)
</div>

---

## ✨ Features

-   🔌 **Plugin System** - Modular, extensible plugin architecture
-   ⚡ **Event Handling** - Sophisticated event management with auto-discovery
-   🎯 **Command Handling** - Support for both slash commands and message commands

## 🚀 Quick Start

### Installation

```bash
# Using npm
npm install cordium discord.js

# Using pnpm
pnpm add cordium discord.js

# Using yarn
yarn add cordium discord.js
```

### Basic Setup

```typescript
import { Client, GatewayIntentBits } from "discord.js";
import { Core } from "cordium";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

const core = new Core(client, {
    baseDirectory: __dirname,
    prefix: ["!", "?"],
    owners: ["YOUR_USER_ID"],
    autoRegisterCommands: true,
    // applicationCommandGuildId: "GUILD_ID", // optional
    isPluginEnabled: (pluginName: string, guildId: string) => boolean | Promise<boolean>,
    beforeCommandRun: (context: Core.Context) => boolean | Promise<boolean>,
});

await core.init();

client.login("YOUR_BOT_TOKEN");
```

## 📁 Project Structure

```
your-project/
├── plugins/
│   ├── moderation/
│   │   ├── moderation.plugin.ts
│   │   ├── commands/
│   │   │   ├── ban.command.ts
│   │   │   └── kick.command.ts
│   │   └── events/
│   │       └── clientReady.event.ts
│   ├── utility/
│   │   ├── plugin.ts
│   │   ├── commands/
│   │   │   ├── ping.command.ts
│   │   │   └── uptime.command.ts
│   │   └── events/
│   │       └── messageCreate.event.ts
├── index.ts
└── package.json
```

## 🔌 Creating Plugins

### Plugin Structure

```typescript
// plugins/example/plugin.ts
import { Plugin } from "cordium";

export class ModerationPlugin extends Plugin {
    constructor(buildOptions: Plugin.BuildOptions) {
        super(buildOptions, {
            name: "Moderation",
        });
    }
}
```

### Commands

```typescript
// plugins/example/commands/hello.command.ts
import { Command } from "cordium";
import {
    ChatInputCommandInteraction,
    Message,
    ContextMenuCommandInteraction,
    ApplicationCommandType,
} from "discord.js";

export class HelloCommand extends Command {
    constructor(buildOptions: Command.BuildOptions) {
        super(buildOptions, {
            name: "hello",
            description: "Says hello to the user",
            aliases: ["hi", "hey"],
        });
    }

    // Build application commands (slash / context menu) using the provided CommandBuilder
    buildApplicationCommands(builder: Command.Builder) {
        return builder
            .addSlashBuilder((slash) =>
                slash
                    .setName(this.name)
                    .setDescription("Says hello!")
                    .addUserOption((option) =>
                        option.setName("user").setDescription("User to greet").setRequired(false)
                    )
            )
            .addContextMenuBuilder((context) => context.setName("User Info").setType(ApplicationCommandType.User));
    }

    // Handle slash command
    async onChatInput(interaction: ChatInputCommandInteraction) {
        const user = interaction.options.getUser("user") || interaction.user;
        await interaction.reply(`Hello, ${user}! 👋`);
    }

    // Handle message command
    async onMessage(message: Message, ...args: any[]) {
        const mention = message.mentions.users.first() || message.author;
        await message.reply(`Hello, ${mention}! 👋`);
    }

    // Handle context menu command
    async onContextMenu(interaction: ContextMenuCommandInteraction) {
        const user = interaction.targetUser;
        await interaction.reply(`User: ${user.tag}`);
    }
}
```

### Events

```typescript
// plugins/example/events/ready.event.ts
import { Event, container } from "cordium";
import { Events } from "discord.js";

export class ClientReadyEvent extends Event {
    constructor(buildOptions: Event.BuildOptions) {
        super(buildOptions, {
            name: Events.ClientReady,
            once: true,
        });
    }

    async run() {
        console.log(`🚀 Bot is ready! Logged in as ${container.core.client.user?.tag}`);
    }
}
```

## 🎯 Advanced Features

### Custom Stores

```typescript
import { container } from "cordium";

// Access the global container
container.store.set("customData", { foo: "bar" });
const data = container.store.get("customData");

// Access plugin/event/command stores
const allPlugins = Array.from(container.pluginStore);
const allEvents = Array.from(container.eventStore);
const allCommands = Array.from(container.commandStore);
```

### Manual Plugin Management

```typescript
// Load specific plugin
await core.handler.loadPlugin("./plugins/moderation/plugin.js");

// Unload all plugins
await core.handler.unloadPlugins();

// Register commands to specific guild
await core.handler.registerCommands("GUILD_ID");
```

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/Kevlid/Cordium.git

# Install dependencies
pnpm install

# Build the framework
pnpm build

# Watch for changes during development
pnpm dev
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔗 Links

-   [Documentation](https://github.com/Kevlid/Cordium) _(Coming Soon)_
-   [NPM Package](https://www.npmjs.com/package/cordium)
-   [GitHub Repository](https://github.com/Kevlid/Cordium)

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/Kevlid">Kevlid</a></p>
  <p><em>⭐ Star this repo if you find it useful!</em></p>
</div>
