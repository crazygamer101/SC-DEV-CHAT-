const fs = require('fs');

async function enter2FA(page) {
    console.log('Please enter your 2FA in the terminal.');
    const code = await new Promise(resolve => process.stdin.once('data', data => resolve(data.toString().trim())));
  
    const codeSelector = 'div[data-cy-id="__auth-code"] input[type="text"]';
    const deviceNameSelector = 'div[data-cy-id="__device-name"] input[type="text"]';
  
    await page.type(codeSelector, code);
    console.log('2FA code typed.');
  
    const faName = 'bot';
    await page.type(deviceNameSelector, faName);
    console.log('Device name typed.');
  
    const faDuration = '1 year';
    await page.click('div[data-cy-id="select_target__content"]');
    await page.evaluate(() => {
      const option = [...document.querySelectorAll('p[data-cy-id="select_option__label"]')].find(el => el.innerText.includes('1 year'));
      if (option) {
        option.click();
      }
    });
    console.log(`Device trusted for: ${faDuration}`);
  
    await page.click('button[type="submit"][data-cy-id="button"]');
    console.log('2FA submitted.');
  }

  async function checkNavigation(page, targetURL) {
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
  const currentURL = page.url();

  if (currentURL === targetURL) {
    console.log('Successfully navigated to SC Testing Chat.');
    return true;
  } else {
    console.error('Did not redirect to the expected URL:', currentURL);
    return false;
  }
}

async function checkNavigation(page, targetURL) {
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
    const currentURL = page.url();
  
    if (currentURL === targetURL) {
      console.log('Successfully navigated to target URL.');
      return true;
    } else {
      console.error('Did not redirect to the expected URL:', currentURL);
      return false;
    }
}

async function saveCookies(page, cookiesPath) {
    const cookies = await page.cookies();
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
    console.log('Cookies saved.');
}

async function handleLogin(page, usernameSelector, passwordSelector, username, password) {
    // Validate inputs
    if (!username) {
      console.error('No username provided.');
      return false;
    }
  
    if (!password) {
      console.error('No password provided.');
      return false;
    }
  
    const usernameAvailable = await waitForSelectorWithTimeout(page, usernameSelector);
    const passwordAvailable = await waitForSelectorWithTimeout(page, passwordSelector);
  
    if (usernameAvailable && passwordAvailable) {
      await page.click(usernameSelector); // Ensure the field is active
      await page.type(usernameSelector, username);
      console.log('Username typed.');
  
      await page.click(passwordSelector); // Ensure the field is active
      await page.type(passwordSelector, password);
      console.log('Password typed.');
      
      return true;
    } else {
      console.error('Failed to find or type in username/password fields.');
      return false;
    }
}

async function rememberMe(page) {
  try {
    console.log('Checking for Remember Me checkbox...');

    // Wait for the checkbox container to be present and visible
    await page.waitForSelector('div[data-cy-id="__remember-me"]', { visible: true, timeout: 60000 });
    console.log('Checkbox found');

    // Scroll the checkbox into view to make sure it's clickable
    await page.evaluate(() => {
      const checkboxElement = document.querySelector('div[data-cy-id="__remember-me"]');
      checkboxElement.scrollIntoView();
    });

    // Check if the checkbox is already checked
    const isChecked = await page.$eval('input[data-cy-id="__remember-me"]', el => el.checked);
    console.log(`Remember Me checkbox checked: ${isChecked}`);

    // If the checkbox is not checked, click the associated label to toggle it
    if (!isChecked) {
      await page.click('label[for]:has(input[data-cy-id="__remember-me"])'); // Click the label associated with the checkbox
      console.log('Remember Me checkbox clicked.');
    } else {
      console.log('Remember Me checkbox was already checked, no action taken.');
    }
  } catch (error) {
    console.error('Error in rememberMe function:', error.message);
  }
}
  
  
async function waitForSelectorWithTimeout(page, selector, options = { timeout: 30000 }) {
    try {
        await page.waitForSelector(selector, options);
        console.log(`Selector found: ${selector}`);
        return true;
    } catch (error) {
        console.error(`Failed to find selector: ${selector}`, error.message);
        return false;
    }
}

module.exports = {
    rememberMe,
    waitForSelectorWithTimeout,
    handleLogin,
    saveCookies,
    checkNavigation,
    enter2FA
  };