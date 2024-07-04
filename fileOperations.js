// fileOperations.js
const fs = require('fs');
const path = require('path');

const DATA_FILE_PATH = path.join(__dirname, 'scraping_data.json');

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

module.exports = { loadScrapingData, saveScrapingData };
