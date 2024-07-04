require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');

const USERNAME = process.env.RSI_USERNAME;
const PASSWORD = process.env.RSI_PASSWORD;
const COOKIES_PATH = 'cookies.json';

async function login(){
  const browser = await puppeteer.launch({headless: false, defaultViewport: null});
  const page = await browser.newPage();

  const cookiesExist =  fs.existsSync(COOKIES_PATH);
  if (cookiesExist) {
    const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf8'));
    await page.setCookie(...cookies);
    console.log('Cookies used');
  };

  await page.goto('https://robertsspaceindustries.com/connect?jumpto=/spectrum/community/SC/lobby/38230',);

  if (!cookiesExist) {
    await page.type('input[data-cy-id="input"][id=":r1:"]', USERNAME);
    await page.type('input[data-cy-id="input"][id=":r2:"]', PASSWORD);
    await page.click('button[type="submit"][data-cy-id="__submit-button"]');

    await page.waitForSelector('input[data-cy-id="input"][id=":r4:"]', { visible: true });

    console.log('Please enter your 2FA in the Terminal.');
    const code = await  new Promise((resolve) => {
      process.stdin.once('data', (data) => resolve(data.toString().trim()));
    });

    await page.type('input[data-cy-id="input"][id=":r4:"]', code);

    const faName = 'bot';
    await page.type('input[data-cy-id="input"][id=":r5:"]', faName);

    const faDuration = '1 year';

    // Trust Device Duration
    await page.click('div[data-cy-id="select_target__content"]');
    await page.waitForSelector(`div[data-cy-id="select_option__${faDuration}"]`, { visible: true });
    await page.click(`div[data-cy-id="select_option__${faDuration}"]`);
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
    if (currentURL === 'https://robertsspaceindustries.com/spectrum/community/SC/lobby/38230') {
      console.log('Monitoring SC Testing Chat.');
    } else {
      console.log('Did not redirect to the expected URL. Current URL:', currentURL);
    }
  }

  // Confirm if redirected to the desired URL
  const currentURL = page.url();
  if (currentURL === 'https://robertsspaceindustries.com/spectrum/community/SC/lobby/38230') {
    console.log('Monitoring SC Testing Chat.');
  } else {
    console.log('Did not redirect to the expected URL. Current URL:', currentURL);
  }
  
  return page;
};

module.exports = login;
