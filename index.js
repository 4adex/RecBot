const { App } = require('@slack/bolt');
require('dotenv').config();
const http = require('http');

// Initialize the Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
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