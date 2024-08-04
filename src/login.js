require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const { timeout } = require('puppeteer');

const USERNAME = process.env.RSI_USERNAME;
const PASSWORD = process.env.RSI_PASSWORD;
const COOKIES_PATH = './localData/cookies.json';
const TARGET_URL = 'https://robertsspaceindustries.com/spectrum/community/SC/lobby/38230';
const CHECK_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

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
};

async function abbreviatedLogin(page) {
  console.log('abbreviated login')


  await page.waitForSelector('input[data-cy-id="input"][id=":r2:"]', {visible: true});

  await page.type('input[data-cy-id="input"][id=":r2:"]', USERNAME);
  await page.type('input[data-cy-id="input"][id=":r3:"]', PASSWORD);
  await page.click('button[type="submit"][data-cy-id="__submit-button"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // Confirm if redirected to the desired URL
  const currentURL = page.url();
  if (currentURL === TARGET_URL) {
    console.log('Monitoring SC Testing Chat.');
  } else {
    console.log('Did not redirect to the expected URL. Current URL:', currentURL);
  }
}

async function performLogin(page) {
  console.log('full log in')
  await page.type('input[data-cy-id="input"][id=":r1:"]', USERNAME);
  await page.type('input[data-cy-id="input"][id=":r2:"]', PASSWORD);
  await page.click('button[type="submit"][data-cy-id="__submit-button"]');

  await page.waitForSelector('input[data-cy-id="input"][id=":r4:"]', { visible: true });

  console.log('Please enter your 2FA in the Terminal.');
  const code = await new Promise((resolve) => {
    process.stdin.once('data', (data) => resolve(data.toString().trim()));
  });

  await page.type('input[data-cy-id="input"][id=":r4:"]', code);

  const faName = 'bot';
  await page.type('input[data-cy-id="input"][id=":r5:"]', faName);

  const faDuration = '1 year';

  // Trust Device Duration
  await page.click('div[data-cy-id="select_target__content"]');

  // Wait for the dropdown options to be visible and ensure it's fully loaded
  await page.waitForSelector('p[data-cy-id="select_option__label"]', { visible: true, timeout: 5000 });

  // Try selecting the option using different methods
  await page.evaluate(() => {
    const option = [...document.querySelectorAll('p[data-cy-id="select_option__label"]')].find(el => el.innerText.includes('1 year'));
    if (option) {
      option.click();
    }
  });

  console.log(`Device trusted for: ${faDuration}`);

  // Submit 2FA
  await page.click('button[type="submit"][data-cy-id="button"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // Save cookies
  const cookies = await page.cookies();
  fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
  console.log('Cookies saved.');

  // Confirm if redirected to the desired URL
  const currentURL = page.url();
  if (currentURL === TARGET_URL) {
    console.log('Monitoring SC Testing Chat.');
  } else {
    console.log('Did not redirect to the expected URL. Current URL:', currentURL);
  }
}

async function periodicCheck() {
  try {
    const page = await login();
    const currentURL = page.url();
    if (currentURL !== TARGET_URL) {
      console.log('Session timed out, performing login.');
      await performLogin(page);
    } else {
      console.log('Session is still active.');
    }
    await page.close();
  } catch (error) {
    console.error('Error during periodic check:', error);
  }
}

setInterval(periodicCheck, CHECK_INTERVAL);

module.exports = login;
