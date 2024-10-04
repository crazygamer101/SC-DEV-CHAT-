const { Client, IntentsBitField } = require('discord.js');
const scraping = require('./scraping');
require('dotenv').config();

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

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

    return sentMessage;
  } catch (error) {
    console.error('Error sending or editing message:', error);
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
  scraping(sendToDiscord, sendMotdToDiscord);
});

client.login(process.env.DISCORD_TOKEN);
