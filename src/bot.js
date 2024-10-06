const { Client, GatewayIntentBits } = require('discord.js');
const scraping = require('./scraping');
const { handleInteraction } = require('./modCommands');
const { sendToDiscord, sendMotdToDiscord } = require('./messages'); // Import sendToDiscord and sendMotdToDiscord
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on('ready', () => {
  console.log(`✔ ${client.user.tag} is Online`);
  // Start the scraping process after the bot is ready
  scraping(sendToDiscord.bind(null, client), sendMotdToDiscord.bind(null, client));
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  handleInteraction(interaction);
});

client.login(process.env.DISCORD_TOKEN);
