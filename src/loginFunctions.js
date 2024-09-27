// loginFunctions.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const {wait} = require('./helpers');

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
  const browser = await puppeteer.launch({ headless: true, defaultViewport: null });
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

async function abbreviatedLogin(page) {
  console.log('Performing abbreviated login');

  try {
    // Wait for the checkbox or some other known element to ensure the page is ready
    await page.waitForSelector('div[data-cy-id="checkbox__display"]', { timeout: 10000 });
  } catch (error) {
    console.error('Failed to find login form checkbox:', error.message);
    return page; // Return page to avoid crashing further
  }

  const usernameInputSelector = 'input[type="text"]'; // Updated username selector
  const passwordInputSelector = 'input[type="password"]'; // Updated password selector

  try {
    // Ensure the username and password fields are available
    await page.waitForSelector(usernameInputSelector, { visible: true });
    await page.waitForSelector(passwordInputSelector, { visible: true });
    
    await page.type(usernameInputSelector, USERNAME);
    await page.type(passwordInputSelector, PASSWORD);
    console.log('Username and password typed.');
  } catch (error) {
    console.error('Failed to find or type in username/password fields:', error.message);
    return page;
  }

  await rememberMe(page);
  
  await page.click('button[type="submit"][data-cy-id="__submit-button"]');
  console.log('Submit button clicked.');

  // Wait for navigation after submission
  try {
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });

    const currentURL = page.url();
    console.log(`Redirected to: ${currentURL}`);

    if (currentURL === TARGET_URL) {
      console.log('Monitoring SC Testing Chat.');

      const cookies = await page.cookies();
      fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
      console.log('Cookies saved.');

    } else {
      console.error('Did not redirect to the expected URL:', currentURL);
    }

    return page; // Return the page after successful login
  } catch (error) {
    console.error('Error during login navigation:', error.message);

    // Attempt to catch any warning messages after login attempt
    const fail = await page.waitForSelector('span[data-cy-id="inline_message__text"]', { timeout: 5000 }).catch(() => null);
    
    if (fail) {
        const warningMessage = await fail.evaluate(el => el.innerText);
        console.error(`Warning message: ${warningMessage}`);
    } else {
        console.error('No warning message found.');
    }
  }

  console.log('Abbreviated login failed.');
  return page; // Ensure the page object is always returned
}

async function performLogin(page) {
  console.log('Performing full login');

  try {
    // Wait for the checkbox or other known element to confirm the page is ready
    await page.waitForSelector('div[data-cy-id="checkbox__display"]', { timeout: 10000 });
  } catch (error) {
    console.error('Failed to find login form checkbox:', error.message);
    return page; // Return page to avoid crashing further
  }

  const usernameInputSelector = 'input[type="text"]'; // Updated username selector
  const passwordInputSelector = 'input[type="password"]'; // Updated password selector

  try {
    // Ensure the username and password fields are available
    await page.waitForSelector(usernameInputSelector, { visible: true });
    await page.waitForSelector(passwordInputSelector, { visible: true });
    
    await page.type(usernameInputSelector, USERNAME);
    await page.type(passwordInputSelector, PASSWORD);
    console.log('Username and password typed.');
  } catch (error) {
    console.error('Failed to find or type in username/password fields:', error.message);
    return page;
  }

  await rememberMe(page);
  
  await page.click('button[type="submit"][data-cy-id="__submit-button"]');
  console.log('Submit button clicked.');

  // Wait for 2FA prompt
  try {
    await page.waitForSelector('button[data-cy-id="button"][type="submit"]', { visible: true });
  } catch (error) {
    console.error('2FA input field not found:', error.message);
    return page;
  }

  console.log('Please enter your 2FA in the terminal.');
  const code = await new Promise(resolve => process.stdin.once('data', data => resolve(data.toString().trim())));

  // Using the new identifiers for 2FA and device name
  const codeSelector = 'div[data-cy-id="__auth-code"] input[type="text"]';
  const deviceNameSelector = 'div[data-cy-id="__device-name"] input[type="text"]';

  try {
    await page.type(codeSelector, code);
    console.log('2FA code typed.');

    const faName = 'bot';
    await page.type(deviceNameSelector, faName);
    console.log('Device name typed.');

    const faDuration = '1 year';
    await page.click('div[data-cy-id="select_target__content"]');
    console.log('Trust device duration clicked.');

    await page.waitForSelector('p[data-cy-id="select_option__label"]', { visible: true, timeout: 5000 });

    await page.evaluate(() => {
      const option = [...document.querySelectorAll('p[data-cy-id="select_option__label"]')].find(el => el.innerText.includes('1 year'));
      if (option) {
        option.click();
      }
    });
    console.log(`Device trusted for: ${faDuration}`);

    await page.click('button[type="submit"][data-cy-id="button"]');
    console.log('2FA submitted.');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    const currentURL = page.url();
    if (currentURL === TARGET_URL) {
      console.log('Monitoring SC Testing Chat.');

      const cookies = await page.cookies();
      fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
      console.log('Cookies saved.');
    } else {
      console.error('Did not redirect to the expected URL. Current URL:', currentURL);
    }

    return page; // Return the page after successful login
  } catch (error) {
    console.error('Failed during 2FA or post-login steps:', error.message);
    
    const fail = await page.waitForSelector('span[data-cy-id="inline_message__text"]', { timeout: 5000 }).catch(() => null);
    
    if (fail) {
        const warningMessage = await fail.evaluate(el => el.innerText);
        console.error(`Warning message: ${warningMessage}`);
    } else {
        console.error('No warning message found.');
    }
}


  console.log('Login process failed.');
  return page;
}

async function periodicCheck(page) {
  try {
    console.log('Starting periodic session check.');

    // Evaluate the lobby name on the current page
    const header = await page.evaluate(() => {
      const lobbyNameElement = document.querySelector('.lobby-name');
      return lobbyNameElement ? lobbyNameElement.textContent.trim() : null;
    });

    console.log(`Lobby name found: ${header}`);

    // Check if the session has timed out or is still active
    if (header !== '#sc-testing-chat') {
      console.log('Session timed out, refreshing page.');
      
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
        console.log('Session still invalid after refresh. Logging in again.');
        
        page = await performLogin(page); // Ensure the new page object is assigned
        if (page) {
          console.log('Re-login successful, new page object assigned.');
        } else {
          console.error('Re-login failed, page object was not returned.');
        }
      } else {
        console.log('Successfully reconnected to Testing Chat after refresh.');
      }
    } else {
      console.log('Session is still valid, monitoring Testing Chat.');
    }
  } catch (error) {
    console.error('Error during periodic session check:', error.message);
  }
}

async function rememberMe(page) {
  try {
    console.log('Checking for Remember Me checkbox...');

    // Wait for the checkbox to be present
    await page.waitForSelector('label[for=":r3:"]', { visible: true, timeout: 60000 });
    console.log('box found')

    // Check if the checkbox is already checked
    const isChecked = await page.$eval('input[data-cy-id="__remember-me"]', el => el.checked);
    console.log(`Remember Me checkbox checked: ${isChecked}`);

    // If the checkbox is not checked, click the label to toggle it
    if (!isChecked) {
      await page.click('label[for=":r3:"]'); // Click the label associated with the checkbox
      console.log('Remember Me checkbox clicked.');
    } else {
      console.log('Remember Me checkbox was already checked, no action taken.');
    }
  } catch (error) {
    console.error('Error in rememberMe function:', error.message);
  }
}

module.exports = { login, startMonitoring };