const { startMonitoring, periodicCheck } = require('./login');
const { updateDateTime, extractTextFromHTML, delay, retry, wait } = require('./helpers');
const { loadScrapingData, saveScrapingData } = require('./fileOperations');
const { getMessages, getMotd } = require('./scrapeFunctions');
const { insertDocument } = require('./dataApiHelper');

async function scraping(sendToDiscord, sendMotdToDiscord, updateBotStats) {
  let page = await startMonitoring();

  if (!page) {
    console.error('Login function did not return a page object after retries.');
    return;
  }

  console.log(`Scraping started at ${updateDateTime()}`);

  let { lastMessageId = '', lastMotdBody = '' } = await loadScrapingData();

  while (true) {
    const scrapeStartTime = Date.now();

    try {
      // Add timeout to entire scraping cycle (25 seconds to allow for processing time)
      await Promise.race([
        (async () => {
          // Check if the page is still attached and refresh if necessary
          if (page.isClosed()) {
            console.warn('Page is closed, restarting monitoring...');
            page = await startMonitoring();
            if (!page) throw new Error('Failed to restart monitoring');
          }

          await periodicCheck(page);

          // Retry getMessages and getMotd in case of navigation issues or errors
          let messages = [];
          let motd = null;

          try {
            messages = await getMessages(page, lastMessageId);
          } catch (error) {
            console.error('Error getting messages:', error.message);
            messages = []; // Continue with empty messages
          }

          try {
            motd = await getMotd(page);
          } catch (error) {
            console.error('Error getting MOTD:', error.message);
            motd = null; // Continue without MOTD
          }

          let dataChanged = false;

          for (const message of messages) {
            message.body = extractTextFromHTML(message.body);
            console.log(message);

            lastMessageId = message.id;

            try {
              // Save message to MongoDB in 'messages' collection with timeout
              await insertDocument('messages', message);
              await sendToDiscord(message);
              dataChanged = true;
            } catch (error) {
              console.error('Error saving/sending message:', error.message);
              // Continue processing other messages even if one fails
            }
          }

          if (motd && motd.body !== lastMotdBody) {
            console.log(motd);

            try {
              // Save MOTD to MongoDB in 'motd' collection with timeout
              await insertDocument('motd', motd);
              await sendMotdToDiscord(motd);
              lastMotdBody = motd.body;
              dataChanged = true;
            } catch (error) {
              console.error('Error saving/sending MOTD:', error.message);
              // Continue even if MOTD save/send fails
            }
          }

          if (dataChanged) {
            await saveScrapingData({ lastMessageId, lastMotdBody });
          }

          // Update bot statistics
          updateBotStats(updateDateTime());

          console.log(`Scrape ended at ${updateDateTime()}`);
        })(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Scraping cycle timeout - restarting')), 25000)
        )
      ]);

    } catch (error) {
      // Log errors and continue the loop after a delay
      console.error(`Scraping error: ${error.message}`);

      if (error.message.includes('detached Frame') || error.message.includes('Scraping cycle timeout')) {
        console.warn('Restarting monitoring due to error...');
        try {
          page = await startMonitoring();  // Restart the page
          if (page) {
            console.log('Monitoring restarted successfully');
          } else {
            console.error('Failed to restart monitoring');
          }
        } catch (restartError) {
          console.error('Error restarting monitoring:', restartError.message);
        }
      }
    }

    const scrapeDuration = Date.now() - scrapeStartTime;
    const waitTime = Math.max(5000, 30000 - scrapeDuration); // Minimum 5 second wait, maximum 30 seconds

    console.log(`Waiting ${waitTime}ms before next scrape cycle...`);
    await delay(waitTime);
  }
}


module.exports = scraping;
