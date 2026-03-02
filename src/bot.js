const { Client, IntentsBitField, REST, Routes, SlashCommandBuilder } = require('discord.js');
const scraping = require('./scraping');
const { updateDateTime } = require('./helpers');
const { findDocuments } = require('./dataApiHelper');
require('dotenv').config();

// Global error handlers to prevent process hangs
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Allow some time for logging before exit
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit on unhandled rejections, just log them
});

// Define slash commands
const commands = [
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check the bot\'s current status and last activity'),

  new SlashCommandBuilder()
    .setName('recent')
    .setDescription('View recent messages from SC Dev Chat')
    .addIntegerOption(option =>
      option.setName('count')
        .setDescription('Number of recent messages to show (1-10)')
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show bot statistics and message counts'),

  new SlashCommandBuilder()
    .setName('motd')
    .setDescription('Show the current Message of the Day'),

  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Test bot responsiveness'),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show available commands and usage information')
];

// Command registration function
async function registerCommands() {
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands.map(command => command.toJSON()) },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
  // Add keep-alive and reconnection settings
  presence: {
    status: 'online',
    activities: [{
      name: 'Monitoring SC Dev Chat',
      type: 3, // Watching
    }],
  },
  // WebSocket settings to prevent disconnections
  ws: {
    properties: {
      $browser: 'Discord iOS', // Helps with rate limiting
    },
  },
});

// Global variables for tracking bot state
let lastScrapeTime = null;
let scrapeCount = 0;
let messageCount = 0;
let errorCount = 0;

async function sendToDiscord(message) {
  try {
    const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID_MESSAGES);
    if (!channel) {
      console.error('Channel not found!');
      return null;
    }

    // Send unformatted message
    const unformattedMessage = `${message.nickname}: ${message.body}`;
    const sentMessage = await channel.send(unformattedMessage);

    // Prepare formatted message
    const formattedMessage = `
# [${message.nickname}](<https://robertsspaceindustries.com/spectrum/community/SC/lobby/38230/message/${message.id}>)
*${message.time}*
>>> **${message.body}**
    `;

    // Edit the message to include formatting
    await sentMessage.edit(formattedMessage);

    // Update message count for statistics
    incrementMessageCount();

    return sentMessage;
  } catch (error) {
    console.error('Error sending or editing message:', error);
    incrementErrorCount();
    return null;
  }
}


async function sendMotdToDiscord(motd) {
  try {
    const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID_MOTD);
    if (!channel) {
      console.error('Channel not found!');
      return null;
    }

    // Send unformatted MOTD
    const unformattedMotd = `${motd.title}: ${motd.body}`;
    const sentMotd = await channel.send(unformattedMotd);

    // Prepare formatted MOTD
    const formattedMotd = `
# [${motd.title}](<https://robertsspaceindustries.com/spectrum/community/SC/lobby/38230>)
*${motd.time}*
>>> **${motd.body}**
    `;

    // Edit the message to include formatting
    await sentMotd.edit(formattedMotd);

    return sentMotd;
  } catch (error) {
    console.error('Error sending or editing MOTD:', error);
    return null;
  }
}


client.on('ready', () => {
  console.log(`✔ ${client.user.tag} is Online`);

  // Start the scraping process after the bot is ready
  scraping(sendToDiscord, sendMotdToDiscord, updateBotStats);
});

// Add reconnection handling
client.on('disconnect', () => {
  console.warn('Discord client disconnected, attempting to reconnect...');
});

client.on('reconnecting', () => {
  console.log('Discord client reconnecting...');
});

client.on('resume', (replayed) => {
  console.log(`Discord client resumed, replayed ${replayed} events`);
});

// Slash command interaction handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    switch (commandName) {
      case 'ping':
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        await interaction.editReply(`🏓 Pong! Latency: ${latency}ms`);
        break;

      case 'status':
        const uptime = process.uptime();
        const uptimeString = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;

        let statusMessage = `🤖 **SC Dev Chat Monitor Status**\n\n`;
        statusMessage += `⏱️ **Uptime:** ${uptimeString}\n`;
        statusMessage += `🔄 **Last Scrape:** ${lastScrapeTime || 'Never'}\n`;
        statusMessage += `📊 **Total Scrapes:** ${scrapeCount}\n`;
        statusMessage += `💬 **Messages Processed:** ${messageCount}\n`;
        statusMessage += `❌ **Errors:** ${errorCount}\n`;
        statusMessage += `🌐 **WebSocket:** ${client.ws.status === 0 ? '🟢 Connected' : '🔴 Disconnected'}\n`;

        await interaction.reply({ content: statusMessage, ephemeral: true });
        break;

      case 'recent':
        const count = interaction.options.getInteger('count') || 5;

        try {
          const recentMessages = await findDocuments('messages', {}, { limit: count, sort: { time: -1 } });

          if (recentMessages.length === 0) {
            await interaction.reply({ content: 'No messages found in database.', ephemeral: true });
            return;
          }

          let response = `📜 **Recent SC Dev Chat Messages** (Last ${count})\n\n`;

          for (const msg of recentMessages.reverse()) {
            const timestamp = msg.time ? `<t:${Math.floor(new Date(msg.time).getTime() / 1000)}:R>` : 'Unknown time';
            response += `**${msg.nickname}:** ${msg.body.substring(0, 100)}${msg.body.length > 100 ? '...' : ''}\n`;
            response += `*${timestamp}*\n\n`;
          }

          await interaction.reply({ content: response, ephemeral: true });
        } catch (error) {
          console.error('Error fetching recent messages:', error);
          await interaction.reply({ content: 'Error retrieving recent messages.', ephemeral: true });
        }
        break;

      case 'stats':
        try {
          const totalMessages = await findDocuments('messages');
          const totalMotd = await findDocuments('motd');

          const now = new Date();
          const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const recentMessages = totalMessages.filter(msg => new Date(msg.time) > last24h);

          let statsMessage = `📈 **SC Dev Chat Statistics**\n\n`;
          statsMessage += `💬 **Total Messages:** ${totalMessages.length}\n`;
          statsMessage += `📢 **Total MOTD Updates:** ${totalMotd.length}\n`;
          statsMessage += `🕐 **Messages (Last 24h):** ${recentMessages.length}\n`;
          statsMessage += `🔄 **Scrape Cycles:** ${scrapeCount}\n`;

          if (lastScrapeTime) {
            const lastScrape = new Date(lastScrapeTime);
            const timeSince = Math.floor((now - lastScrape) / 1000 / 60);
            statsMessage += `⏰ **Minutes Since Last Scrape:** ${timeSince}\n`;
          }

          await interaction.reply({ content: statsMessage, ephemeral: true });
        } catch (error) {
          console.error('Error fetching stats:', error);
          await interaction.reply({ content: 'Error retrieving statistics.', ephemeral: true });
        }
        break;

      case 'motd':
        try {
          const motdData = await findDocuments('motd', {}, { limit: 1, sort: { time: -1 } });

          if (motdData.length === 0) {
            await interaction.reply({ content: 'No Message of the Day found.', ephemeral: true });
            return;
          }

          const currentMotd = motdData[0];
          const timestamp = currentMotd.time ? `<t:${Math.floor(new Date(currentMotd.time).getTime() / 1000)}:f>` : 'Unknown time';

          const motdMessage = `📢 **Current Message of the Day**\n\n` +
            `**${currentMotd.title}**\n` +
            `*${timestamp}*\n\n` +
            `${currentMotd.body}`;

          await interaction.reply({ content: motdMessage, ephemeral: true });
        } catch (error) {
          console.error('Error fetching MOTD:', error);
          await interaction.reply({ content: 'Error retrieving Message of the Day.', ephemeral: true });
        }
        break;

      case 'help':
        const helpMessage = `🆘 **SC Dev Chat Monitor - Help**\n\n` +
          `**Available Commands:**\n\n` +
          `🔹 **/ping** - Test bot responsiveness\n` +
          `🔹 **/status** - Check bot status and activity\n` +
          `🔹 **/recent [count]** - View recent messages (1-10)\n` +
          `🔹 **/stats** - Show database statistics\n` +
          `🔹 **/motd** - Show current Message of the Day\n` +
          `🔹 **/help** - Show this help message\n\n` +
          `💡 **Tips:**\n` +
          `• Commands are private (only you can see responses)\n` +
          `• The bot monitors SC Dev Chat every 30 seconds\n` +
          `• Messages are automatically posted to the configured channel`;

        await interaction.reply({ content: helpMessage, ephemeral: true });
        break;

      default:
        await interaction.reply({ content: 'Unknown command.', ephemeral: true });
    }
  } catch (error) {
    console.error('Error handling command:', error);
    if (!interaction.replied) {
      await interaction.reply({ content: 'An error occurred while processing the command.', ephemeral: true });
    }
  }
});

// Register commands and start scraping when bot is ready
client.on('ready', async () => {
  console.log(`✔ ${client.user.tag} is Online`);

  // Register slash commands
  await registerCommands();

  // Start the scraping process after the bot is ready
  scraping(sendToDiscord, sendMotdToDiscord, updateBotStats);
});

client.on('error', (error) => {
  console.error('Discord client error:', error);
});

// Update global tracking variables
function updateBotStats(scrapeTime) {
  lastScrapeTime = scrapeTime;
  scrapeCount++;
}

function incrementMessageCount() {
  messageCount++;
}

function incrementErrorCount() {
  errorCount++;
}

// Export functions for use in other modules
module.exports = {
  updateBotStats,
  incrementMessageCount,
  incrementErrorCount
};

client.login(process.env.DISCORD_TOKEN);
