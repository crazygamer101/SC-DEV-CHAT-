const { Client, GatewayIntentBits } = require('discord.js');
const { getAllMotdIds, getAllMessageIds } = require('./dataApiHelper'); // Importing the new functions
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

async function sendToDiscord(message) {
  try {
    const motdChannelIds = await getAllMotdIds();
    const channels = await Promise.all(motdChannelIds.map(id => client.channels.fetch(id)));

    for (const channel of channels) {
      if (!channel) {
        console.error('No MOTD channel found!');
        continue;
      }

      const formattedMessage = `
# [${message.nickname}](<https://robertsspaceindustries.com/spectrum/community/SC/lobby/38230/message/${message.id}>)
*${message.time}*
>>> **${message.body}**
      `;

      await channel.send(formattedMessage);
    }
  } catch (error) {
    console.error('Error sending message to Discord:', error.message);
    throw error;
  }
}

async function sendMotdToDiscord(motd) {
  try {
    const messagesChannelIds = await getAllMessageIds();
    const channels = await Promise.all(messagesChannelIds.map(id => client.channels.fetch(id)));

    for (const channel of channels) {
      if (!channel) {
        console.error('No messages channel found!');
        continue;
      }

      const formattedMotd = `
# [${motd.title}](<https://robertsspaceindustries.com/spectrum/community/SC/lobby/38230>)
*${motd.time}*
>>> **${motd.body}**
      `;

      await channel.send(formattedMotd);
    }
  } catch (error) {
    console.error('Error sending MOTD to Discord:', error.message);
    throw error;
  }
}

client.login(process.env.DISCORD_TOKEN);

module.exports = {
  sendToDiscord,
  sendMotdToDiscord,
};
