require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js')

const token = process.env.DISCORD_TOKEN
const clientId = process.env.DISCORD_ID
const guildId = process.env.GUILD_ID

const createChannelCommand = (name, description) => ({
  name,
  description,
  options: [
    {
      name: 'channel',
      description: 'Select the appropriate channel',
      type: ApplicationCommandOptionType.Channel,
      required: true,
    }
  ],
});

const commands = [
  createChannelCommand('set-motd-channel', 'choose which channel will receive testing chat MOTD updates.'),
  createChannelCommand('set-messages-channel', 'choose which channel will receive testing chat Dev messages.'),
  createChannelCommand('remove-motd-channel', 'remove a channel from receiving testing chat MOTD updates.'),
  createChannelCommand('remove-messages-channel', 'remove a channel from receiving testing chat Dev messages.'),
  {
    name: 'reset-notifications',
    description: 'This will delete all notification channels',
  }
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Registering commands...')

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    )

    console.log('Commands registered Successfully')

  } catch (error) {
    console.log(`There was an error: ${error.message}\n${error.stack}`);
  }
})();
