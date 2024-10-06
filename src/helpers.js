// helpers.js
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function updateDateTime() {
  const today = new Date();
  const date = (today.getMonth() + 1) + '-' + today.getDate() + '-' + today.getFullYear();
  const hours = today.getHours().toString().padStart(2, '0');
  const minutes = today.getMinutes().toString().padStart(2, '0');
  const seconds = today.getSeconds().toString().padStart(2, '0');
  return `${date} ${hours}:${minutes}:${seconds}`;
}

function extractTextFromHTML(html) {
  const { parseDocument } = require('htmlparser2');
  const doc = parseDocument(html);
  const textParts = [];

  function traverse(node) {
    if (node.type === 'text') {
      textParts.push(node.data);
    } else if (node.name === 'span' && node.attribs && node.attribs['data-tip']) {
      textParts.push(node.attribs['data-tip']);
    } else if (node.children) {
      node.children.forEach(child => traverse(child));
    }
  }

  traverse(doc);
  return textParts.join('');
}

// Retry helper function
async function retry(fn, retries = 3, delayTime = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.error(`Error on attempt ${attempt}: ${error.message}`);
      if (attempt < retries) {
        console.log(`Retrying in ${delayTime / 1000} seconds...`);
        await delay(delayTime);
      } else {
        throw error;
      }
    }
  }
}

// Define the wait function to create a delay
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// helpers.js
function parseRelativeTime(relativeTime) {
  const currentDate = new Date();

  if (/(\d+)\s+hours?\s+ago/.test(relativeTime)) {
    const hoursAgo = parseInt(RegExp.$1, 10);
    currentDate.setHours(currentDate.getHours() - hoursAgo);
  } else if (/an?\s+hour\s+ago/.test(relativeTime)) {
    currentDate.setHours(currentDate.getHours() - 1);
  } else if (/(\d+)\s+minutes?\s+ago/.test(relativeTime)) {
    const minutesAgo = parseInt(RegExp.$1, 10);
    currentDate.setMinutes(currentDate.getMinutes() - minutesAgo);
  } else if (/an?\s+minute\s+ago/.test(relativeTime)) {
    currentDate.setMinutes(currentDate.getMinutes() - 1);
  } else if (/(\d+)\s+seconds?\s+ago/.test(relativeTime)) {
    const secondsAgo = parseInt(RegExp.$1, 10);
    currentDate.setSeconds(currentDate.getSeconds() - secondsAgo);
  } else if (/an?\s+second\s+ago/.test(relativeTime)) {
    currentDate.setSeconds(currentDate.getSeconds() - 1);
  } else if (/a\s+few\s+seconds\s+ago/.test(relativeTime)) {
    currentDate.setSeconds(currentDate.getSeconds() - 10); // Approximate as 10 seconds ago
  } else if (/(\d+)\s+days?\s+ago/.test(relativeTime)) {
    const daysAgo = parseInt(RegExp.$1, 10);
    currentDate.setDate(currentDate.getDate() - daysAgo);
  } else if (/yesterday/.test(relativeTime)) {
    currentDate.setDate(currentDate.getDate() - 1);
  } else if (/just\s+now/.test(relativeTime)) {
    // Time is currentDate
  } else {
    console.warn(`Unknown relative time format: ${relativeTime}`);
    return null; // Return null if the format is unrecognized
  }

  return currentDate;
}

function getDiscordTimestamp(date) {
  const unixTimestamp = Math.floor(date.getTime() / 1000); // Convert to seconds
  return `<t:${unixTimestamp}:f>`; // Full date and time format for Discord
}

module.exports = {
  updateDateTime,
  extractTextFromHTML,
  delay,
  wait,
  retry,
  getDiscordTimestamp,
  parseRelativeTime
};
async function fetchChannelsByIds(client, channelIds) {
  try {
    const channels = await Promise.all(channelIds.map(id => client.channels.fetch(id)));
    return channels.filter(channel => channel !== null);
  } catch (error) {
    console.error('Error fetching channels:', error.message);
    return [];
  }
}

module.exports = {
  updateDateTime,
  extractTextFromHTML,
  delay,
  wait,
  retry,
  getDiscordTimestamp,
  parseRelativeTime,  
  fetchChannelsByIds
};
