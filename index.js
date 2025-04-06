const { App } = require('@slack/bolt');
require('dotenv').config();
const http = require('http');
const { MongoClient } = require('mongodb');

// Initialize the Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});


let db;
let equipmentsCollection;

async function connectToMongoDB() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    db = client.db(process.env.MONGODB_DB_NAME || 'equipmentTracker');
    equipmentsCollection = db.collection('equipments');
    
    // Check if equipment document exists, create default if not
    const equipments = await equipmentsCollection.findOne({ _id: 'equipmentStatus' });
    if (!equipments) {
      await equipmentsCollection.insertOne({
        _id: 'equipmentStatus',
        mic1: 'akshat',
        mic2: 'adesh',
        tripod1: 'mohit',
        tripod2: 'garv'
      });
      console.log('Created default equipment status');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

// Listen for equipment status requests
app.message('bot equipments status', async ({ message, say }) => {
  try {
    const equipments = await equipmentsCollection.findOne({ _id: 'equipmentStatus' });
    
    if (!equipments) {
      await say('Equipment status not found. Please initialize the database.');
      return;
    }
    
    // Remove _id field from response
    delete equipments._id;
    
    // Format the response
    let response = '*Current Equipment Status:*\n';
    for (const [equipment, person] of Object.entries(equipments)) {
      response += `• *${equipment}*: ${person}\n`;
    }
    
    await say(response);
  } catch (error) {
    console.error('Error fetching equipment status:', error);
    await say('Error fetching equipment status. Please try again later.');
  }
});

// Listen for equipment assignment updates
app.message(/bot (.*) has (.*)/, async ({ context, message, say }) => {
  try {
    // Extract person and equipment from the message
    const matches = context.matches;
    const person = matches[1].trim();
    const equipment = matches[2].trim();
    
    // Check if the equipment exists in our database
    const equipments = await equipmentsCollection.findOne({ _id: 'equipmentStatus' });
    
    if (!equipments || !equipments.hasOwnProperty(equipment)) {
      await say(`Sorry, the equipment "${equipment}" is not in the database.`);
      return;
    }
    
    // Update the equipment assignment
    const updateResult = await equipmentsCollection.updateOne(
      { _id: 'equipmentStatus' },
      { $set: { [equipment]: person } }
    );
    
    if (updateResult.modifiedCount === 1) {
      await say(`✅ Updated! *${equipment}* is now assigned to *${person}*`);
    } else {
      await say(`No changes made. *${equipment}* was already assigned to *${person}*.`);
    }
    
  } catch (error) {
    console.error('Error updating equipment assignment:', error);
    await say('Error updating equipment assignment. Please try again later.');
  }
});

// Listen for messages containing "bot ping"
app.message('bot ping', async ({ message, say }) => {
  try {
    // Reply with "bot pong"
    await say('bot pong');
  } catch (error) {
    console.error('Error responding to bot ping:', error);
  }
});

// Create a simple HTTP server for health checks
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running!\n');
});

// Start the app
(async () => {
  const port = process.env.PORT || 3000;
  
  // Start the HTTP server
  server.listen(port, () => {
    console.log(`HTTP server listening on port ${port}`);
  });
  
  // Start the Slack app
  await app.start();
  console.log(`⚡️ Slack bot is running!`);
})();