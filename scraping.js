const fs = require('fs');
const path = require('path');
const login = require('./login');
const { parseDocument } = require('htmlparser2');

const DATA_FILE_PATH = path.join(__dirname, 'scraping_data.json');

function updateDateTime() {
  const today = new Date();
  const date = (today.getMonth() + 1) + '-' + today.getDate() + '-' + today.getFullYear();
  const hours = today.getHours().toString().padStart(2, '0'); // Pad hours with leading zero if less than 10
  const minutes = today.getMinutes().toString().padStart(2, '0'); // Pad minutes with leading zero if less than 10
  const seconds = today.getSeconds().toString().padStart(2, '0'); // Pad seconds with leading zero if less than 10
  return `${date} ${hours}:${minutes}:${seconds}`;
}

function extractTextFromHTML(html) {
  const doc = parseDocument(html);
  const textParts = [];

  function traverse(node) {
    if (node.type === 'text') {
      textParts.push(node.data);
    } else if (node.name === 'span' && node.attribs && node.attribs['data-tip']) {
      // This is an emoji span with data-tip attribute
      textParts.push(node.attribs['data-tip']);
    } else if (node.children) {
      node.children.forEach(child => traverse(child));
    }
  }

  traverse(doc);
  return textParts.join('');
}

async function getMessages(page, lastMessageId) {
  return await page.evaluate((lastMessageId) => {
    const messageList = document.querySelectorAll(".message-item.status-default");

    // Return Message list as an array, filtering by color and last seen ID
    return Array.from(messageList).map((message) => {
      const id = message.getAttribute("data-message-id");
      const nicknameElement = message.querySelector(".displayname .nickname");
      const timeElement = message.querySelector(".time > span");
      const bodyElement = message.querySelector(".body > div");

      const nickname = nicknameElement ? nicknameElement.innerText : null;
      const time = timeElement ? timeElement.innerText : null;
      const body = bodyElement ? bodyElement.innerHTML : null;

      // Filter messages by color
      const displayNameElement = message.querySelector(".displayname");
      const messageColor = displayNameElement ? getComputedStyle(displayNameElement).color : null;
      if (messageColor === 'rgb(222, 195, 66)' && id > lastMessageId) {
        return { id, nickname, time, body };
      } else {
        return null; // Skip this message
      }
    }).filter(message => message !== null); // Remove null entries
  }, lastMessageId);
}

async function getMotd(page) {
  return await page.evaluate(() => {
    const motdElement = document.querySelector(".lobby-message__wrapper");
    if (!motdElement) {
      return null;
    }

    const titleElement = motdElement.querySelector(".lobby-message__title");
    const timeElement = motdElement.querySelector(".lobby-message__informations");
    const bodyElement = motdElement.querySelector(".lobby-message__body");

    const title = titleElement ? titleElement.innerText : null;
    const time = timeElement ? timeElement.innerText : null;
    const body = bodyElement ? bodyElement.innerText : null;

    return { title, time, body };
  });
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function loadScrapingData() {
  try {
    const data = await fs.promises.readFile(DATA_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading scraping data file:', err.message);
    return {};
  }
}

async function saveScrapingData(data) {
  try {
    await fs.promises.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2));
    console.log('Scraping data saved successfully.');
  } catch (err) {
    console.error('Error saving scraping data file:', err.message);
  }
}

async function scraping(sendToDiscord, sendMotdToDiscord) {
  const page = await login();

  // Check if the page object is properly returned
  if (!page) {
    console.error('Login function did not return a page object.');
    return;
  }

  console.log(`Scraping started at ${updateDateTime()}`);

  // Load existing data from file or initialize if empty
  let { lastMessageId = '', lastMotdBody = '' } = await loadScrapingData();

  // Main loop to fetch messages every 30 seconds
  while (true) {
    const messages = await getMessages(page, lastMessageId);
    const motd = await getMotd(page);

    // Log new messages and update the last seen message ID
    let dataChanged = false;
    for (const message of messages) {
      message.body = extractTextFromHTML(message.body);
      console.log(message);

      lastMessageId = message.id; // Update the last message ID

      // Send each new message to Discord
      await sendToDiscord(message);
      dataChanged = true; // Data has changed if a new message is sent
    }

    // Send MOTD to Discord if it exists and has changed
    if (motd && motd.body !== lastMotdBody) {
      console.log(motd);
      await sendMotdToDiscord(motd);
      lastMotdBody = motd.body; // Update the last posted MOTD body
      dataChanged = true; // Data has changed if MOTD is updated
    }

    // Save the scraping data only if there has been a change
    if (dataChanged) {
      await saveScrapingData({ lastMessageId, lastMotdBody });
    }

    // Log the datetime when the scrape iteration ends
    console.log(`Scrape ended at ${updateDateTime()}`);

    // Wait for 30 seconds before fetching messages again
    await delay(5000);
  }
}

module.exports = scraping;
