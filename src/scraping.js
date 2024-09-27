// scraping.js
const { startMonitoring } = require('./loginFunctions');
const { updateDateTime, extractTextFromHTML, delay } = require('./helpers');
const { loadScrapingData, saveScrapingData } = require('./fileOperations');
const { getMessages, getMotd } = require('./scrapeFunctions');
const { insertDocument } = require('./dataApiHelper');

async function scraping(sendToDiscord, sendMotdToDiscord) {
  const page = await startMonitoring();

  if (!page) {
    console.error('Login function did not return a page object.');
    return;
  }

  console.log(`Scraping started at ${updateDateTime()}`);

  let { lastMessageId = '', lastMotdBody = '' } = await loadScrapingData();

  while (true) {
    const messages = await getMessages(page, lastMessageId);
    const motd = await getMotd(page);

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

    await delay(30000);
  }
}

module.exports = scraping;