// loginFunctions.js
require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const { rememberMe, waitForSelectorWithTimeout, handleLogin, saveCookies, checkNavigation, enter2FA, } = require('./loginHelpers');

const USERNAME = process.env.RSI_USERNAME || ''; // Default to empty string if not set
const PASSWORD = process.env.RSI_PASSWORD || ''; // Default to empty string if not set
const COOKIES_PATH = './localData/cookies.json';
const TARGET_URL = 'https://robertsspaceindustries.com/spectrum/community/SC/lobby/38230';
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

async function startMonitoring() {
  const page = await login(); // Perform login and get the page object
  setInterval(() => periodicCheck(page), CHECK_INTERVAL); // Call periodicCheck with the page object

  return page;
}

async function login() {
  const browser = await puppeteer.launch({ headless: true, defaultViewport: null }); // Make sure this is set to true

  const page = await browser.newPage();

  const cookiesExist = fs.existsSync(COOKIES_PATH);
  if (cookiesExist) {
    const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf8'));
    await page.setCookie(...cookies);
    console.log('Cookies used');
  }

  await page.goto('https://robertsspaceindustries.com/connect?jumpto=/spectrum/community/SC/lobby/38230');

  if (cookiesExist) {
    let currentURL = page.url();
    if (currentURL !== TARGET_URL) {
      console.log('Cookies use failed. Current URL:', currentURL);
      await abbreviatedLogin(page);
    } else {
      console.log('Monitoring SC Testing Chat.');
    }
  } else {
    await performLogin(page);
  }

  return page;
}

// Refactored abbreviatedLogin function
async function abbreviatedLogin(page) {
  console.log('Performing abbreviated login');

  await page.goto('https://robertsspaceindustries.com/connect?jumpto=/spectrum/community/SC/lobby/38230', { waitUntil: 'networkidle0' });

  if (!(await waitForSelectorWithTimeout(page, 'div[data-cy-id="checkbox__display"]'))) return page;

  const usernameSelector = 'div[data-cy-id="__email"] input[data-cy-id="input"]';
  const passwordSelector = 'div[data-cy-id="__password"] input[data-cy-id="input"]';

  if (!(await handleLogin(page, usernameSelector, passwordSelector, USERNAME, PASSWORD))) return page;

  await rememberMe(page);

  await page.click('button[type="submit"][data-cy-id="__submit-button"]');
  console.log('Submit button clicked.');

  if (await checkNavigation(page, TARGET_URL)) {
    await saveCookies(page, COOKIES_PATH);
  }

  return page;
}

// Refactored performLogin function
async function performLogin(page) {
  console.log('Performing full login');

  if (!(await waitForSelectorWithTimeout(page, 'div[data-cy-id="checkbox__display"]'))) return page;

  if (!(await handleLogin(page, 'div[data-cy-id="__email"] input[data-cy-id="input"]', 'div[data-cy-id="__password"] input[data-cy-id="input"]', USERNAME, PASSWORD))) return page;

  await rememberMe(page);
  
  await page.click('button[type="submit"][data-cy-id="__submit-button"]');
  console.log('Submit button clicked.');

  if (!(await waitForSelectorWithTimeout(page, 'button[data-cy-id="button"][type="submit"]'))) return page;

  await enter2FA(page);

  if (await checkNavigation(page, TARGET_URL)) {
    await saveCookies(page, COOKIES_PATH);
  }

  return page;
}

async function periodicCheck(page) {
  try {
      // Evaluate the lobby name on the current page
      const header = await page.evaluate(() => {
      const lobbyNameElement = document.querySelector('.lobby-name');
      return lobbyNameElement ? lobbyNameElement.textContent.trim() : null;
      });

      // Check if the session has timed out or is still active
      if (header !== '#sc-testing-chat') {
      console.warn('Session timed out, refreshing page.');
      
      await page.reload({ waitUntil: ['networkidle0'] });
      console.log('Page reloaded, checking session again.');

      // Check the lobby name again after page reload
      const refreshedHeader = await page.evaluate(() => {
          const lobbyNameElement = document.querySelector('.lobby-name');
          return lobbyNameElement ? lobbyNameElement.textContent.trim() : null;
      });

      console.log(`Lobby name after refresh: ${refreshedHeader}`);

      // If the session is still invalid after refresh, attempt login
      if (refreshedHeader !== '#sc-testing-chat') {
          console.warn('Session still invalid after refresh. Logging in again.');
          
          page = await performLogin(page); // Ensure the new page object is assigned
          if (page) {
          console.log('Re-login successful, new page object assigned.');
          } else {
          console.error('Re-login failed, page object was not returned.');
          }
      } else {
          console.log('Successfully reconnected to Testing Chat after refresh.');
      }
      } 
  } catch (error) {
      console.error('Error during periodic session check:', error.message);
  }
}

module.exports = { login, startMonitoring, performLogin, periodicCheck };
