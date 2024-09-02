// scrapeFunctions.js
async function getMessages(page, lastMessageId) {
  return await page.evaluate((lastMessageId) => {
    const messageList = document.querySelectorAll(".message-item.status-default");

    return Array.from(messageList).map((message) => {
      const id = message.getAttribute("data-message-id");
      const nicknameElement = message.querySelector(".displayname .nickname");
      const timeElement = message.querySelector(".time > span");
      const bodyElement = message.querySelector(".body > div");

      const nickname = nicknameElement ? nicknameElement.innerText : null;
      const time = timeElement ? timeElement.innerText : null;
      const body = bodyElement ? bodyElement.innerHTML : null;

      const displayNameElement = message.querySelector(".displayname");
      const messageColor = displayNameElement ? getComputedStyle(displayNameElement).color : null;

      if ((messageColor === 'rgb(222, 195, 66)' || (messageColor === 'rgb(125, 103, 233') || (messageColor === 'rgb(255, 98, 98)')) && id > lastMessageId) {
        return { id, nickname, time, body };
      } else {
        return null;
      }
    }).filter(message => message !== null);
  }, lastMessageId);
}

async function getMotd(page) {
  return await page.evaluate(() => {
    const motdElement = document.querySelector(".lobby-message__wrapper");
    if (!motdElement) {
      return null;
    }

    const titleElement = motdElement.querySelector(".lobby-message__title");
    const timeElement = motdElement.querySelector(".lobby-message__informations");
    const bodyElement = motdElement.querySelector(".lobby-message__body");

    const title = titleElement ? titleElement.innerText : null;
    const time = timeElement ? timeElement.innerText : null;
    const body = bodyElement ? bodyElement.innerText : null;

    return { title, time, body };
  });
}

module.exports = { getMessages, getMotd };
