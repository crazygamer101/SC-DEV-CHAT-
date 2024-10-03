const { startMonitoring } = require('./loginFunctions');
const { updateDateTime, extractTextFromHTML, delay, retry, wait } = require('./helpers');
const { loadScrapingData, saveScrapingData } = require('./fileOperations');
const { getMessages, getMotd } = require('./scrapeFunctions');
const { insertDocument } = require('./dataApiHelper');

async function scraping(sendToDiscord, sendMotdToDiscord) {
  let page = await startMonitoring();

  if (!page) {
    console.error('Login function did not return a page object after retries.');
    return;
  }

  console.log(`Scraping started at ${updateDateTime()}`);

  let { lastMessageId = '', lastMotdBody = '' } = await loadScrapingData();

  while (true) {
    try {
      // Check if the page is still attached and refresh if necessary
      if (page.isClosed()) {
        console.warn('Page is closed, restarting monitoring...');
        page = await startMonitoring();
        if (!page) throw new Error('Failed to restart monitoring');
      }

      // Retry getMessages and getMotd in case of navigation issues or errors
      const messages = await retry(async () => await getMessages(page, lastMessageId));
      const motd = await retry(async () => await getMotd(page));

      let dataChanged = false;

      for (const message of messages) {
        message.body = extractTextFromHTML(message.body);
        console.log(message);

        lastMessageId = message.id;

        // Save message to MongoDB in 'messages' collection
        await insertDocument('messages', message);

        await sendToDiscord(message);
        dataChanged = true;
      }

      if (motd && motd.body !== lastMotdBody) {
        console.log(motd);

        // Save MOTD to MongoDB in 'motd' collection
        await insertDocument('motd', motd);

        await sendMotdToDiscord(motd);
        lastMotdBody = motd.body;
        dataChanged = true;
      }

      if (dataChanged) {
        await saveScrapingData({ lastMessageId, lastMotdBody });
      }

      console.log(`Scrape ended at ${updateDateTime()}`);

    } catch (error) {
      // Log errors and continue the loop after a delay
      console.error(`Scraping error: ${error.message}`);

      if (error.message.includes('detached Frame')) {
        console.warn('Frame is detached, refreshing the page...');
        page = await startMonitoring();  // Restart the page
        if (!page) throw new Error('Failed to restart monitoring after frame detachment');
      }
    }

    // Wait for 30 seconds before the next scrape cycle
    await delay(30000);
  }
}


module.exports = scraping;
