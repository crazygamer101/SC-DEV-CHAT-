// dataApiHelper.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

const { MONGO_URI } = process.env;

let client;
let db;

async function connectToMongoDB() {
  if (!client) {
    // Configure MongoDB client with connection pooling and timeouts
    client = new MongoClient(MONGO_URI, {
      maxPoolSize: 10, // Maximum number of connections in the connection pool
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
    });
    await client.connect();
    db = client.db('scraping'); // Specify your database name here
  }
  return db;
}


async function insertDocument(collectionName, document) {
  try {
    const db = await connectToMongoDB();
    const collection = db.collection(collectionName);
    // Add timeout to individual operations
    const result = await Promise.race([
      collection.insertOne(document),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('MongoDB insert timeout')), 10000)
      )
    ]);
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
