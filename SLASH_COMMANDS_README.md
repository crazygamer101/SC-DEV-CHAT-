# SC Dev Chat Monitor - Slash Commands Guide

## Overview
The SC Dev Chat Monitor bot now supports slash commands for interacting with the bot through Discord. All commands are private (ephemeral) responses that only you can see.

## Setup Requirements

### Environment Variables
Make sure your `.env` file includes:
```
DISCORD_CLIENT_ID=your_bot_client_id_here
DISCORD_TOKEN=your_bot_token_here
DISCORD_CHANNEL_ID_MESSAGES=your_messages_channel_id
DISCORD_CHANNEL_ID_MOTD=your_motd_channel_id
MONGO_URI=your_mongodb_connection_string
RSI_USERNAME=your_rsi_username
RSI_PASSWORD=your_rsi_password
```

### Discord Bot Permissions
Your bot needs the following intents enabled in the Discord Developer Portal:
- Server Members Intent
- Message Content Intent

And these permissions in your server:
- Send Messages
- Use Slash Commands
- Read Message History

## Available Commands

### `/ping`
**Description:** Test bot responsiveness
**Usage:** `/ping`
**Response:** Shows latency in milliseconds

### `/status`
**Description:** Check the bot's current status and activity
**Usage:** `/status`
**Response:** Shows uptime, last scrape time, total scrapes, messages processed, errors, and WebSocket status

### `/recent [count]`
**Description:** View recent messages from SC Dev Chat
**Parameters:**
- `count` (optional): Number of recent messages to show (1-10, default: 5)
**Usage:** `/recent` or `/recent count:3`
**Response:** Shows the specified number of most recent messages with timestamps

### `/stats`
**Description:** Show bot statistics and message counts
**Usage:** `/stats`
**Response:** Shows total messages, MOTD updates, messages in last 24h, scrape cycles, and time since last scrape

### `/motd`
**Description:** Show the current Message of the Day
**Usage:** `/motd`
**Response:** Shows the latest MOTD with title, timestamp, and content

### `/help`
**Description:** Show available commands and usage information
**Usage:** `/help`
**Response:** Comprehensive help message with all commands and tips

## Command Registration

Commands are automatically registered when the bot starts up. If you add new commands, the bot will register them on the next restart.

To manually refresh commands (useful during development):
1. Stop the bot
2. Delete the commands from Discord (if needed)
3. Restart the bot - it will re-register all commands

## Tips & Best Practices

### Privacy
- All command responses are ephemeral (private) - only you can see them
- This prevents cluttering channels with command outputs

### Rate Limiting
- Discord has rate limits for slash commands
- The bot includes automatic retry logic for failed operations
- Commands that query the database may take a moment to respond

### Error Handling
- If a command fails, you'll see an error message
- Most errors are logged to the console for debugging
- The bot continues monitoring even if individual commands fail

### Database Queries
- Commands that fetch data from MongoDB will show the most recent information
- Large datasets are limited to prevent Discord's message length limits
- Timestamps use Discord's relative time formatting (`<t:timestamp:R>`)

## Troubleshooting

### Commands Not Appearing
1. Ensure the bot has been restarted after adding new commands
2. Check that `DISCORD_CLIENT_ID` is correct in your `.env`
3. Verify the bot has "applications.commands" scope in your server

### Commands Returning Errors
1. Check the bot's console logs for detailed error messages
2. Ensure MongoDB connection is working
3. Verify all required environment variables are set

### No Data in Responses
1. The bot may not have scraped any data yet
2. Check that the scraping process is running (use `/status`)
3. Ensure RSI credentials are correct for login

## Development Notes

### Adding New Commands
1. Add the command definition to the `commands` array in `bot.js`
2. Add a case in the `interactionCreate` event handler
3. Implement the command logic
4. Restart the bot to register the new command

### Command Structure
```javascript
new SlashCommandBuilder()
  .setName('command_name')
  .setDescription('Command description')
  .addStringOption(option =>
    option.setName('parameter')
      .setDescription('Parameter description')
      .setRequired(false))
```

### Response Types
- `ephemeral: true` - Private response (recommended for most commands)
- `ephemeral: false` - Public response (use sparingly)

## Support
If you encounter issues:
1. Check the bot's console output for error messages
2. Use `/status` to verify the bot is running properly
3. Ensure all environment variables are correctly configured
4. Check Discord bot permissions and intents
