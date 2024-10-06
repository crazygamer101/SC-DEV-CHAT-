const { MongoClient } = require('mongodb');
require('dotenv').config();

const { MONGO_URI } = process.env;

const client = new MongoClient(MONGO_URI);
let db = null;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db('HSDWGBotDB');
  }
}

// Connect to the database once when the application starts
connectDB().catch(error => {
  console.error('Error connecting to MongoDB:', error);
  process.exit(1);
});

async function insertDocument(collectionName, document) {
  try {
    const collection = db.collection(collectionName);
    const result = await collection.insertOne(document);
    return result;
  } catch (error) {
    console.error('Error inserting document:', error);
    throw error;
  }
}

async function findDocuments(collectionName, filter = {}) {
  try {
    const collection = db.collection(collectionName);
    const documents = await collection.find(filter).toArray();
    return documents;
  } catch (error) {
    console.error('Error finding documents:', error);
    throw error;
  }
}

async function findMotdChannel(guildId, channelId) {
  try {
    const collection = db.collection('MOTD channels');
    const documents = await collection.find({ guildId, channelId }).toArray();
    return documents;
  } catch (error) {
    console.error('Error finding channel:', error);
    throw error;
  }
}

async function saveMotdChannel(guildId, channelId) {
  const existingChannels = await findMotdChannel(guildId, channelId);

  if (existingChannels.length > 0) {
    console.log('Channel already exists in the database.');
    return;
  }

  try {
    const result = await insertDocument('MOTD channels', { guildId, channelId });
    console.log(`Channel stored in MongoDB: ${result.insertedId}`);
  } catch (err) {
    console.error(`Error storing channel in MongoDB: ${err.message}`);
    throw err;
  }
}

async function removeMotdChannel(guildId, channelId) {
  try {
    const collection = db.collection('MOTD channels');
    const result = await collection.deleteOne({ guildId, channelId });
    console.log(`Channel removed from MongoDB: ${result.deletedCount} document(s) deleted.`);
  } catch (err) {
    console.error(`Error removing channel from MongoDB: ${err.message}`);
    throw err;
  }
}

async function findMessagesChannel(guildId, channelId) {
  try {
    const collection = db.collection('Messages channels');
    const documents = await collection.find({ guildId, channelId }).toArray();
    return documents;
  } catch (error) {
    console.error('Error finding channel:', error);
    throw error;
  }
}

async function removeMessagesChannel(guildId, channelId) {
  try {
    const collection = db.collection('Messages channels');
    const result = await collection.deleteOne({ guildId, channelId });
    console.log(`Channel removed from MongoDB: ${result.deletedCount} document(s) deleted.`);
  } catch (err) {
    console.error(`Error removing channel from MongoDB: ${err.message}`);
    throw err;
  }
}

async function saveMessagesChannel(guildId, channelId) {
  const existingChannels = await findMessagesChannel(guildId, channelId);

  if (existingChannels.length > 0) {
    console.log('Channel already exists in the database.');
    return;
  }

  try {
    const result = await insertDocument('Messages channels', { guildId, channelId });
    console.log(`Channel stored in MongoDB: ${result.insertedId}`);
  } catch (err) {
    console.error(`Error storing channel in MongoDB: ${err.message}`);
    throw err;
  }
}

async function removeAllChannels(guildId) {
  try {
    const messagesCollection = db.collection('Messages channels');
    const motdCollection = db.collection('MOTD channels');

    const [messagesResult, motdResult] = await Promise.all([
      messagesCollection.deleteMany({ guildId }),
      motdCollection.deleteMany({ guildId }),
    ]);

    console.log(`Channels removed from MongoDB: ${messagesResult.deletedCount} messages channels, ${motdResult.deletedCount} MOTD channels.`);
  } catch (err) {
    console.error(`Error removing channels from MongoDB: ${err.message}`);
    throw err;
  }
}

async function getAllMessageIds() {
  try {
    const collection = db.collection('Messages channels');
    const documents = await collection.find({}).toArray();
    if (!documents) {
      return [];
    }
    return documents.map(doc => doc.channelId);
  } catch (error) {
    console.error('Error getting channel IDs:', error);
    throw error;
  }
}

async function getAllMotdIds() {
  try {
    const collection = db.collection('MOTD channels');
    const documents = await collection.find({}).toArray();
    if (!documents) {
      return [];
    }
    return documents.map(doc => doc.channelId);
  } catch (error) {
    console.error('Error getting channel IDs:', error);
    throw error;
  }
}

module.exports = {
  insertDocument,
  findDocuments,
  saveMotdChannel,
  findMotdChannel,
  removeMotdChannel,
  saveMessagesChannel,
  findMessagesChannel,
  removeMessagesChannel,
  removeAllChannels,
  getAllMotdIds,
  getAllMessageIds,
};