//dataApiHelper.js
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
    dataSource: 'HSDWGBotDB',
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
    dataSource: 'HSDWGBotDB',
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

async function findMotdChannel(guildId, channelId) {
  const url = `${MONGO_API_URL}/action/find`;
  const data = {
    dataSource: 'HSDWGBotDB',
    database: 'channels',
    collection: 'MOTD channels',
    filter: { guildId, channelId },
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data.documents;
  } catch (error) {
    console.error('Error finding channel:', error.response.data);
    throw error;
  }
}

async function saveMotdChannel(guildId, channelId) {
  const existingChannels = await findMotdChannel(guildId, channelId);

  if (existingChannels.length > 0) {
    console.log('Channel already exists in the database.');
    return;
  }

  const url = `${MONGO_API_URL}/action/insertOne`;
  const data = {
    dataSource: 'HSDWGBotDB',
    database: 'channels',
    collection: 'MOTD channels',
    document: { guildId, channelId },
  };

  try {
    const response = await axios.post(url, data, { headers });
    console.log(`Channel stored in MongoDB Atlas: ${response.data}`);
  } catch (err) {
    console.error(`Error storing channel in MongoDB Atlas: ${err.message}`);
    throw err;
  }
}

async function removeMotdChannel(guildId, channelId) {
  const url = `${MONGO_API_URL}/action/deleteOne`;
  const data = {
    dataSource: 'HSDWGBotDB',
    database: 'channels',
    collection: 'MOTD channels',
    filter: { guildId, channelId },
  };

  try {
    const response = await axios.post(url, data, { headers });
    console.log(`Channel removed from MongoDB Atlas: ${response.data}`);
  } catch (err) {
    console.error(`Error removing channel from MongoDB Atlas: ${err.message}`);
    throw err;
  }
}

async function findMessagesChannel(guildId, channelId) {
  const url = `${MONGO_API_URL}/action/find`;
  const data = {
    dataSource: 'HSDWGBotDB',
    database: 'channels',
    collection: 'Messages channels',
    filter: { guildId, channelId },
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data.documents;
  } catch (error) {
    console.error('Error finding channel:', error.response.data);
    throw error;
  }
}

async function removeMessagesChannel(guildId, channelId) {
  const url = `${MONGO_API_URL}/action/deleteOne`;
  const data = {
    dataSource: 'HSDWGBotDB',
    database: 'channels',
    collection: 'Messages channels',
    filter: { guildId, channelId },
  };

  try {
    const response = await axios.post(url, data, { headers });
    console.log(`Channel removed from MongoDB Atlas: ${response.data}`);
  } catch (err) {
    console.error(`Error removing channel from MongoDB Atlas: ${err.message}`);
    throw err;
  }
}

async function saveMessagesChannel(guildId, channelId) {
  const existingChannels = await findMessagesChannel(guildId, channelId);

  if (existingChannels.length > 0) {
    console.log('Channel already exists in the database.');
    return;
  }

  const url = `${MONGO_API_URL}/action/insertOne`;
  const data = {
    dataSource: 'HSDWGBotDB',
    database: 'channels',
    collection: 'Messages channels',
    document: { guildId, channelId },
  };

  try {
    const response = await axios.post(url, data, { headers });
    console.log(`Channel stored in MongoDB Atlas: ${response.data}`);
  } catch (err) {
    console.error(`Error storing channel in MongoDB Atlas: ${err.message}`);
    throw err;
  }
}

async function findMotdGuild(guildId) {
  const url = `${MONGO_API_URL}/action/find`;
  const data = {
    dataSource: 'HSDWGBotDB',
    database: 'channels',
    collection: 'MOTD channels',
    filter: { guildId },
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data.documents;
  } catch (error) {
    console.error('Error finding channel in DB:', error.response.data);
    throw error;
  }
}

async function findMessagesGuild(guildId) {
  const url = `${MONGO_API_URL}/action/find`;
  const data = {
    dataSource: 'HSDWGBotDB',
    database: 'channels',
    collection: 'Messages channels',
    filter: { guildId },
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data.documents;
  } catch (error) {
    console.error('Error finding channel in DB:', error.response.data);
    throw error;
  }
}

async function removeAllChannels(guildId) {
  const existingMessagesChannels = await findMessagesGuild(guildId);
  const existingMotdChannels = await findMotdGuild(guildId);

  if (existingMessagesChannels.length === 0 && existingMotdChannels.length === 0) {
    console.log('No channels found in the database.');
    return;
  }

  const deleteMessagesUrl = `${MONGO_API_URL}/action/deleteMany`;
  const deleteMessagesData = {
    dataSource: 'HSDWGBotDB',
    database: 'channels',
    collection: 'Messages channels',
    filter: { guildId },
  };

  const deleteMotdUrl = `${MONGO_API_URL}/action/deleteMany`;
  const deleteMotdData = {
    dataSource: 'HSDWGBotDB',
    database: 'channels',
    collection: 'MOTD channels',
    filter: { guildId },
  };

  try {
    const [messagesResponse, motdResponse] = await Promise.all([
      axios.post(deleteMessagesUrl, deleteMessagesData, { headers }),
      axios.post(deleteMotdUrl, deleteMotdData, { headers }),
    ]);

    console.log(`Channels removed from MongoDB Atlas: ${JSON.stringify(messagesResponse.data)}, ${JSON.stringify(motdResponse.data)}`);
  } catch (err) {
    console.error(`Error removing channels from MongoDB Atlas: ${err.message}`);
    console.error(err.response.data);
    throw err;
  }
}

async function getAllMessageIds(collection) {
  const url = `${MONGO_API_URL}/action/find`;
  const data = {
    dataSource: 'HSDWGBotDB',
    database: 'channels',
    collection: 'Messages channels',
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data.documents.map(doc => doc.channelId);
  } catch (error) {
    console.error(`Error getting channel IDs from collection ${collection}:`, error.response.data);
    throw error;
  }
}

async function getAllMotdIds(collection) {
  const url = `${MONGO_API_URL}/action/find`;
  const data = {
    dataSource: 'HSDWGBotDB',
    database: 'channels',
    collection: 'MOTD channels',
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data.documents.map(doc => doc.channelId);
  } catch (error) {
    console.error(`Error getting channel IDs from collection ${collection}:`, error.response.data);
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
  findMotdGuild,
  findMessagesGuild,
  removeAllChannels,
  getAllMotdIds,
  getAllMessageIds
};
