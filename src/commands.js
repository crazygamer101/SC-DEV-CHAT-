const { saveMotdChannel, removeMotdChannel, saveMessagesChannel, removeMessagesChannel, removeAllChannels, } = require('./dataApiHelper');

async function handleInteraction(interaction) {
  if (!interaction.isCommand()) return;

  const { commandName, options, guildId } = interaction;

  switch (commandName) {
    case 'set-motd-channel':
      const motdChannel = options.getChannel('channel');
      try {
        await saveMotdChannel(guildId, motdChannel.id);
        await interaction.reply(`Motd channel set to ${motdChannel.name}.`);
      } catch (error) {
        console.error(`Error setting MOTD channel: ${error.message}`);
        await interaction.reply(`Failed to set MOTD channel: ${error.message}`);
      }
      break;

    case 'remove-motd-channel':
      const motdChannelToRemove = options.getChannel('channel');
      try {
        await removeMotdChannel(guildId, motdChannelToRemove.id);
        await interaction.reply(`Motd channel removed.`);
      } catch (error) {
        console.error(`Error removing MOTD channel: ${error.message}`);
        await interaction.reply(`Failed to remove MOTD channel: ${error.message}`);
      }
      break;

    case 'set-messages-channel':
      const messagesChannel = options.getChannel('channel');
      try {
        await saveMessagesChannel(guildId, messagesChannel.id);
        await interaction.reply(`Messages channel set to ${messagesChannel.name}.`);
      } catch (error) {
        console.error(`Error setting messages channel: ${error.message}`);
        await interaction.reply(`Failed to set messages channel: ${error.message}`);
      }
      break;

    case 'remove-messages-channel':
      const messagesChannelToRemove = options.getChannel('channel');
      try {
        await removeMessagesChannel(guildId, messagesChannelToRemove.id);
        await interaction.reply(`Messages channel removed.`);
      } catch (error) {
        console.error(`Error removing messages channel: ${error.message}`);
        await interaction.reply(`Failed to remove messages channel: ${error.message}`);
      }
      break;

    case 'reset-notifications':
      try {
        await removeAllChannels(guildId);
        console.log(`Successfully removed all channels for guildId: ${guildId}`);
        await interaction.reply('All update channels have been reset');
      } catch (error) {
        console.error(`Error resetting all update channels: ${error.message}`);
        await interaction.reply(`There was an error resetting all of the update channels: ${error.message}`);
      }
      break;

    default:
      break;
  }
}

module.exports = {
  handleInteraction,
};
