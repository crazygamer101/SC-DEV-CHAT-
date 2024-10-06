const { getAllMotdIds, getAllMessageIds } = require('./dataApiHelper'); // Importing the new functions
const { fetchChannelsByIds } = require('./helpers'); // Import the fetchChannelsByIds helper function

async function sendToDiscord(client, message) {
  try {
    const motdChannelIds = await getAllMotdIds();
    const channels = await fetchChannelsByIds(client, motdChannelIds);

    for (const channel of channels) {
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

async function sendMotdToDiscord(client, motd) {
  try {
    const messagesChannelIds = await getAllMessageIds();
    const channels = await fetchChannelsByIds(client, messagesChannelIds);

    for (const channel of channels) {
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

module.exports = {
  sendToDiscord,
  sendMotdToDiscord,
};
