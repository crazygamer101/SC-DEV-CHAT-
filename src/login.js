require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');

const USERNAME = process.env.RSI_USERNAME;
const PASSWORD = process.env.RSI_PASSWORD;
const COOKIES_PATH = './localData/cookies.json';
const TARGET_URL = 'https://robertsspaceindustries.com/spectrum/community/SC/lobby/38230';
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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

// Define the wait function to create a delay
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function abbreviatedLogin(page) {
  console.log('abbreviated login');

  await page.waitForSelector('div[data-cy-id="checkbox__display"]');

  // Loop through possible "r" values (r1 to r4)
  for (let i = 1; i <= 4; i++) {
    const inputLabelSelector = `label[data-cy-id="input-label"][for=":r${i}:"] span`;
    
    // Wait for the selector and get the text content
    const labelText = await page.$eval(inputLabelSelector, el => el.textContent).catch(() => null);

    // Check if the label text contains "Email"
    if (labelText && labelText.includes('Email')) {
      // Use the correct "r" value for the input fields
      const usernameSelector = `input[data-cy-id="input"][id=":r${i}:"]`;
      const passwordSelector = `input[data-cy-id="input"][id=":r${i + 1}:"]`; // Assuming the password field follows the username field

      console.log(`Selector Used for Username: ${usernameSelector}`);

      // Wait for the username input field to be visible
      await page.waitForSelector(usernameSelector, { visible: true });

      // Type the username and password
      await page.type(usernameSelector, USERNAME);
      await page.type(passwordSelector, PASSWORD);

      // Add a delay before pressing the submit button
      await wait(5255); // Wait for 5.2 seconds (2000 milliseconds)

      // Click the submit button
      await page.click('button[type="submit"][data-cy-id="__submit-button"]');

      // Wait for the navigation to complete
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      // Confirm if redirected to the desired URL
      const currentURL = page.url();

      await wait(10000);

      if (currentURL === TARGET_URL) {
        console.log('Monitoring SC Testing Chat.');
      } else {
        console.log('Did not redirect to the expected URL. Current URL:', currentURL);
      }
      return; // Exit the function after finding and using the correct inputs
    }
  }

  // If no "Email" label was found
  console.log('No Email input field found.');
}

async function performLogin(page) {
  console.log('full log in');

  await page.waitForSelector('div[data-cy-id="checkbox__display"]');

  // Loop through possible "r" values (r1 to r4) to find username and password fields
  for (let i = 1; i <= 4; i++) {
    const inputLabelSelector = `label[data-cy-id="input-label"][for=":r${i}:"] span`;
    
    const labelText = await page.$eval(inputLabelSelector, el => el.textContent).catch(() => null);
    if (labelText && labelText.includes('Email')) {
      const usernameSelector = `input[data-cy-id="input"][id=":r${i}:"]`;
      const passwordSelector = `input[data-cy-id="input"][id=":r${i + 1}:"]`;

      console.log(`Selector Used for Username: ${usernameSelector}`);

      // Username input field
      try {
        await page.waitForSelector(usernameSelector, { visible: true });
        await page.type(usernameSelector, USERNAME);
        await page.type(passwordSelector, PASSWORD);
        console.log('Username and password typed.');
      } catch (error) {
        console.error('Failed to find or type in username/password fields:', error.message);
        continue; 
      }

      await wait(5255); 
      await page.click('button[type="submit"][data-cy-id="__submit-button"]');
      console.log('Submit button clicked.');

      // Wait for the 2FA input field
      try {
        await page.waitForSelector('button[data-cy-id="button"][type="submit"]', { visible: true });
      } catch (error) {
        console.error('2FA input field not found:', error.message);
        continue; 
      }

      console.log('Please enter your 2FA in the Terminal.');
      const code = await new Promise(resolve => process.stdin.once('data', data => resolve(data.toString().trim())));

      for (let j = 5; j <= 8; j++) { // Change to <= 8
        const authLabelSelector = `label[data-cy-id="input-label"][for=":r${j}:"] span`;
        const authLabelText = await page.$eval(authLabelSelector, el => el.textContent).catch(() => null);
        
        if (authLabelText && authLabelText.includes('Authentication Code')) {
          // 2FA Code Input
          const codeSelector = `input[data-cy-id="input"][id=":r${j}:"]`;
          await page.type(codeSelector, code);
          console.log('2FA code typed.');
          
          // Trust Device Name
          const faName = 'bot';
          await page.type(`input[data-cy-id="input"][id=":r${j + 1}:"]`, faName);
          console.log('Device name typed.');

          const faDuration = '1 year';

          // Trust Device Duration
          await page.click('div[data-cy-id="select_target__content"]');
          console.log('Trust device duration clicked.');

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
          console.log('2FA submitted.');

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
          return; // Exit the function after successful login
        }
      }
    }
  }

  console.log('No Email input field found.');
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
