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
  const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID_MESSAGES);
  if (!channel) {
    console.error('Channel not found!');
    return null;
  }

  const formattedMessage = `
# [${message.nickname}](<https://robertsspaceindustries.com/spectrum/community/SC/lobby/38230/message/${message.id}>) 
*${message.time}*
>>> **${message.body}**
  `;

  const sentMessage = await channel.send(formattedMessage);
  return sentMessage;
}

async function sendMotdToDiscord(motd) {
  const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID_MOTD);
  if (!channel) {
    console.error('Channel not found!');
    return null;
  }

  const formattedMotd = `
# [${motd.title}](<https://robertsspaceindustries.com/spectrum/community/SC/lobby/38230>)
*${motd.time}*
>>> **${motd.body}**
  `;

  const sentMotd = await channel.send(formattedMotd);
  return sentMotd;
}

client.on('ready', () => {
  console.log(`✔ ${client.user.tag} is Online`);

  // Start the scraping process after the bot is ready
  scraping(sendToDiscord, sendMotdToDiscord);
});

client.login(process.env.DISCORD_TOKEN);
