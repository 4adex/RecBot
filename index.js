const { App } = require('@slack/bolt');
require('dotenv').config();

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

// Start the app
(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);
  console.log(`⚡️ Slack bot is running on port ${port}!`);
})();