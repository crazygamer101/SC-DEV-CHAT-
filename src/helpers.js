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

// Define the wait function to create a delay
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//Login Helpers

module.exports = { updateDateTime, extractTextFromHTML, delay, wait };
