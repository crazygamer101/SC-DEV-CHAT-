const login = require('./login');
const { parseDocument } = require('htmlparser2');

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

async function getMessages(page, lastNickname) {
  return await page.evaluate((lastNickname) => {
    const messageList = document.querySelectorAll(".message-item.status-default");

    // Return Message list as an array, filtering by color
    return Array.from(messageList).map((message) => {
      const id = message.getAttribute("data-message-id");
      const nicknameElement = message.querySelector(".displayname .nickname");
      const timeElement = message.querySelector(".time > span");
      const bodyElement = message.querySelector(".body > div");

      const nickname = nicknameElement ? nicknameElement.innerText : lastNickname;
      const time = timeElement ? timeElement.innerText : null;
      const body = bodyElement ? bodyElement.innerHTML : null;

      // Filter messages by color
      const displayNameElement = message.querySelector(".displayname");
      const messageColor = displayNameElement ? getComputedStyle(displayNameElement).color : null;
      if (messageColor === 'rgb(222, 195, 66)') {
        return { id, nickname, time, body };
      } else {
        return null; // Skip this message
      }
    }).filter(message => message !== null); // Remove null entries
  }, lastNickname);
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

async function scraping(sendToDiscord, sendMotdToDiscord) {
  const page = await login();

  // Check if the page object is properly returned
  if (!page) {
    console.error('Login function did not return a page object.');
    return;
  }

  console.log(`Scraping started at ${updateDateTime()}`);

  // Set to keep track of seen message IDs and the last seen nickname
  const seenMessageIds = new Set();
  let lastNickname = '';
  let lastDiscordMessage = null;
  let lastMotdBody = '';

  // Main loop to fetch messages every 30 seconds
  while (true) {
    const messages = await getMessages(page, lastNickname);
    const motd = await getMotd(page);

    // Filter out messages that have already been seen
    const newMessages = messages.filter(message => !seenMessageIds.has(message.id));

    // Log new messages and add their IDs to the set of seen messages
    for (const message of newMessages) {
      message.body = extractTextFromHTML(message.body);
      console.log(message);
      seenMessageIds.add(message.id);

      // Update lastNickname if current message's nickname is not null
      if (message.nickname) {
        lastNickname = message.nickname;

        // Send each new message to Discord
        lastDiscordMessage = await sendToDiscord(message);
      } else if (lastDiscordMessage) {
        // Edit the previous Discord message if the nickname is null
        await sendMotdToDiscord(lastDiscordMessage, message.body);
      }
    }

    // Send MOTD to Discord if it exists and has changed
    if (motd && motd.body !== lastMotdBody) {
      console.log(motd);
      await sendMotdToDiscord(motd);
      lastMotdBody = motd.body; // Update the last posted MOTD body
    }

    // Log the datetime when the scrape iteration ends
    console.log(`Scrape ended at ${updateDateTime()}`);

    // Wait for 30 seconds before fetching messages again
    await delay(30000);
  }
}

module.exports = scraping;
