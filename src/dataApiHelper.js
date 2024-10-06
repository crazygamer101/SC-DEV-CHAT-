// dataApiHelper.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

const { MONGO_URI } = process.env;

let client;
let db;

async function connectToMongoDB() {
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db('scraping'); // Specify your database name here
  }
  return db;
}


async function insertDocument(collectionName, document) {
  try {
    const db = await connectToMongoDB();
    const collection = db.collection(collectionName);
    const result = await collection.insertOne(document);
    return result;
  } catch (error) {
    console.error('Error inserting document:', error.message);
    throw error;
  }
}

async function findDocuments(collectionName, filter = {}) {
  try {
    const db = await connectToMongoDB();
    const collection = db.collection(collectionName);
    const documents = await collection.find(filter).toArray();
    return documents;
  } catch (error) {
    console.error('Error finding documents:', error.message);
    throw error;
  }
}

module.exports = { insertDocument, findDocuments };
