// loginFunctions.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const { rememberMe, periodicCheck, waitForSelectorWithTimeout, handleLogin, saveCookies, checkNavigation, enter2FA, retry } = require('./helpers');

const USERNAME = process.env.RSI_USERNAME;
const PASSWORD = process.env.RSI_PASSWORD;
const COOKIES_PATH = './localData/cookies.json';
const TARGET_URL = 'https://robertsspaceindustries.com/spectrum/community/SC/lobby/38230';
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

async function startMonitoring() {
  const page = await login(); // Perform login and get the page object
  setInterval(() => periodicCheck(page), CHECK_INTERVAL); // Call periodicCheck with the page object

  return page;
}

async function login() {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
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
  
  if (!(await waitForSelectorWithTimeout(page, 'div[data-cy-id="checkbox__display"]'))) return page;

  if (!(await handleLogin(page, 'input[type="text"]', 'input[type="password"]', USERNAME, PASSWORD))) return page;

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

  if (!(await handleLogin(page, 'input[type="text"]', 'input[type="password"]', USERNAME, PASSWORD))) return page;

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


module.exports = { login, startMonitoring };