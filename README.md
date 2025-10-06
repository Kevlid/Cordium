<div align="center">
  <h1>🔥 Cordium</h1>
  <p><em>The modern, powerful Discord bot framework for TypeScript</em></p>
  
  [![NPM Version](https://img.shields.io/npm/v/cordium?style=for-the-badge&color=blue)](https://www.npmjs.com/package/cordium)
  [![License](https://img.shields.io/npm/l/cordium?style=for-the-badge&color=green)](LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord)](https://discord.js.org/)
</div>

---

## ✨ Features

-   🔌 **Plugin System** - Modular, extensible plugin architecture
-   ⚡ **Event Handling** - Sophisticated event management with auto-discovery
-   🎯 **Command Framework** - Support for both slash commands and message commands

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
import { Client } from "discord.js";
import { CordiumCore } from "cordium";

const client = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent"],
});

const core = new CordiumCore(client, {
    baseDirectory: __dirname,
    prefix: ["!", "?"],
    owners: ["YOUR_USER_ID"],
    autoRegisterCommands: true,
});

client.login("YOUR_BOT_TOKEN");
```

## 📁 Project Structure

```
your-project/
├── plugins/
│   ├── moderation/
│   │   ├── plugin.ts
│   │   ├── commands/
│   │   │   ├── ban.command.ts
│   │   │   └── kick.command.ts
│   │   └── events/
│   │       └── clientReady.event.ts
│   └── music/
│       ├── plugin.ts
│       └── commands/
│           ├── play.command.ts
│           └── queue.command.ts
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
import { Command, CommandBuilder } from "cordium";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export class HelloCommand extends Command {
    constructor(buildOptions: Command.BuildOptions) {
        super(buildOptions, {
            name: "hello",
            description: "Says hello to the user",
            aliases: ["hi", "hey"],
        });
    }

    // Build slash command
    build(builder: CommandBuilder) {
        return builder.buildSlashCommand((slash) =>
            slash
                .setName(this.name)
                .setDescription("Says hello!")
                .addUserOption((option) => option.setName("user").setDescription("User to greet").setRequired(false))
        );
    }

    // Handle slash command
    async runChatInput(interaction: ChatInputCommandInteraction) {
        const user = interaction.options.getUser("user") || interaction.user;
        await interaction.reply(`Hello, ${user}! 👋`);
    }

    // Handle message command
    async runMessage(message: Message, ...args: string[]) {
        const mention = message.mentions.users.first() || message.author;
        await message.reply(`Hello, ${mention}! 👋`);
    }
}
```

### Events

```typescript
// plugins/example/events/ready.event.ts
import { Event } from "cordium";
import { Events } from "discord.js";

export class ClientReadyEvent extends Event {
    constructor(buildOptions: Event.BuildOptions) {
        super(buildOptions, {
            name: Events.ClientReady,
            once: true,
        });
    }

    async run() {
        console.log(`🚀 Bot is ready! Logged in as ${this.plugin.core.client.user?.tag}`);
    }
}
```

## ⚙️ Configuration

```typescript
interface CordiumOptions {
    baseDirectory: string; // Base directory for plugins
    prefix?: string | string[]; // Command prefix(es)
    owners?: string | string[]; // Bot owner(s)
    autoRegisterCommands?: boolean; // Auto-register slash commands
    isPluginEnabled?: (pluginName: string, guildId: string) => boolean;
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
await core.loadPlugin("./plugins/moderation/plugin.js");

// Unload all plugins
await core.unloadPlugins();

// Register commands to specific guild
core.registerCommands("GUILD_ID");
```

### Context Menu Commands

```typescript
build(builder: CommandBuilder) {
  return builder.buildContextMenuCommand(context =>
    context
      .setName('User Info')
      .setType(ApplicationCommandType.User)
  );
}

async runContextMenu(interaction: ContextMenuCommandInteraction) {
  const user = interaction.targetUser;
  await interaction.reply(`User: ${user.tag}`);
}
```

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/Kevlid/Cordium.git

# Install dependencies
pnpm install

# Build the framework
pnpm build

# Watch for changes
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
