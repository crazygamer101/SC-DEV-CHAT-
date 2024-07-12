//registerCommands.js
require('dotenv').config();
const {REST, Routes, ApplicationCommandOptionType } = require('discord.js')

const token = process.env.DISCORD_TOKEN
const clientId = process.env.DISCORD_ID
const guildId = process.env.GUILD_ID

const commands = [
  {
    name: 'set-motd-channel',
    description: 'choose which channel will recieve testing chat MOTD updates.',
    options: [
      {
        name: 'channel',
        description: 'Select MOTD channel',
        type: ApplicationCommandOptionType.Channel,
        required: true,
      }
    ],
  },
  {
    name:'set-messages-channel',
    description: 'choose which channel will recieve testing chat Dev messages.',
    options: [
      {
        name: 'channel',
        description: 'Select MOTD channel',
        type: ApplicationCommandOptionType.Channel,
        required: true,
      }
    ],
  },
  {
    name: 'remove-motd-channel',
    description: 'remove a channel from receiving testing chat MOTD updates.',
    options: [
      {
        name: 'channel',
        description: 'Select MOTD channel',
        type: ApplicationCommandOptionType.Channel,
        required: true,
      }
    ],
  },
  {
    name:'remove-messages-channel',
    description: 'remove a channel from recieving testing chat Dev messages.',
    options: [
      {
        name: 'channel',
        description: 'Select MOTD channel',
        type: ApplicationCommandOptionType.Channel,
        required: true,
      }
    ],
  },
  {
    name:'reset-notifications',
    description: 'This will delete all notification channels'
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
    console.log(`There was an error: ${error}`);
  }
})();