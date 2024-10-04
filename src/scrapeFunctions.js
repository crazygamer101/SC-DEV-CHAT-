// scrapeFunctions.js
const { parseRelativeTime, getDiscordTimestamp } = require('./helpers');

async function getMessages(page, lastMessageId) {
  const scrapedMessages = await page.evaluate((lastMessageId) => {
    const messageList = document.querySelectorAll(".message-item.status-default");

    return Array.from(messageList).map((message) => {
      const id = message.getAttribute("data-message-id");
      const nicknameElement = message.querySelector(".displayname .nickname");
      const timeElement = message.querySelector(".time > span"); // Scrape the time
      const bodyElement = message.querySelector(".body > div");

      const nickname = nicknameElement ? nicknameElement.innerText : null;
      const time = timeElement ? timeElement.innerText.trim() : null; // Scraped time in HH:MM format
      const body = bodyElement ? bodyElement.innerHTML : null;

      const displayNameElement = message.querySelector(".displayname");
      const messageColor = displayNameElement ? getComputedStyle(displayNameElement).color : null;

      if (
        (messageColor === 'rgb(222, 195, 66)' ||
          messageColor === 'rgb(125, 103, 233)' ||
          messageColor === 'rgb(255, 98, 98)') &&
        id > lastMessageId
      ) {
        return { id, nickname, time, body };
      } else {
        return null;
      }
    }).filter((message) => message !== null);
  }, lastMessageId);

  // Process messages to calculate exact time
  const formattedMessages = scrapedMessages.map((message) => {
    if (message && message.time) {
      try {
        // Log the raw time for debugging
        console.log(`Raw scraped time for message ID ${message.id}: '${message.time}'`);

        // Remove any non-digit characters except colon
        const cleanTime = message.time.replace(/[^\d:]/g, '').trim();

        // Ensure the time is in HH:MM format
        const timePattern = /^([01]?\d|2[0-3]):[0-5]\d$/;
        if (timePattern.test(cleanTime)) {
          const [hoursStr, minutesStr] = cleanTime.split(':');
          const hours = parseInt(hoursStr, 10);
          const minutes = parseInt(minutesStr, 10);

          // Log parsed hours and minutes
          console.log(`Parsed time for message ID ${message.id}: hours=${hours}, minutes=${minutes}`);

          // Create a new Date object with the current date and scraped time
          const now = new Date();
          const messageDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            hours,
            minutes,
            0,
            0
          );

          // If message time is in the future (e.g., after midnight), adjust the date back by one day
          if (messageDate.getTime() > now.getTime()) {
            messageDate.setDate(messageDate.getDate() - 1);
          }

          // Format the timestamp for Discord
          message.time = getDiscordTimestamp(messageDate);
        } else {
          console.warn(`Invalid time format for message ID ${message.id}: '${cleanTime}'`);
          message.time = "Invalid Time";
        }
      } catch (error) {
        console.error(`Error parsing time for message ID ${message.id}:`, error);
        message.time = "Invalid Time";
      }
    } else {
      console.warn(`Time missing for message ID ${message.id}`);
      message.time = "Invalid Time";
    }
    return message;
  });

  return formattedMessages;
}

async function getMotd(page) {
  const motd = await page.evaluate(() => {
    const motdElement = document.querySelector('.lobby-message__wrapper');
    if (!motdElement) {
      return null;
    }

    const titleElement = motdElement.querySelector('.lobby-message__title');
    const timeElement = motdElement.querySelector('.lobby-message__informations'); // Scrape relative time
    const bodyElement = motdElement.querySelector('.lobby-message__body');

    const title = titleElement ? titleElement.innerText : null;
    const time = timeElement ? timeElement.innerText.trim() : null;
    const body = bodyElement ? bodyElement.innerText : null;

    return { title, time, body };
  });

  if (motd && motd.time) {
    try {
      const parsedDate = parseRelativeTime(motd.time);

      if (parsedDate) {
        // Use getDiscordTimestamp to format the date for Discord
        motd.time = getDiscordTimestamp(parsedDate);
      } else {
        motd.time = 'Invalid Time';
      }
    } catch (error) {
      console.error('Error parsing MOTD time: ', error);
      motd.time = 'Invalid Time';
    }
  }

  return motd;
}

module.exports = { getMessages, getMotd };
