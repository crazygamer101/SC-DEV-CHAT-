// dataApiHelper.js
const axios = require('axios');
require('dotenv').config();

const { MONGO_API_KEY, MONGO_API_URL } = process.env;

const headers = {
  'Content-Type': 'application/json',
  'api-key': MONGO_API_KEY,
};

async function insertDocument(collection, document) {
  const url = `${MONGO_API_URL}/action/insertOne`;
  const data = {
    dataSource: 'sc-dev-chat-data', // Use your cluster name here
    database: 'scraping',
    collection,
    document,
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error) {
    console.error('Error inserting document:', error.response.data);
    throw error;
  }
}

async function findDocuments(collection, filter = {}) {
  const url = `${MONGO_API_URL}/action/find`;
  const data = {
    dataSource: 'sc-dev-chat-data', // Use your cluster name here
    database: 'scraping',
    collection,
    filter,
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data.documents;
  } catch (error) {
    console.error('Error finding documents:', error.response.data);
    throw error;
  }
}

module.exports = { insertDocument, findDocuments };
