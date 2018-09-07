const express = require('express');
const path = require('path');
const { getLatestChatId, getNewToken, authorize } = require('./youtubeService');

const app = express();

const port = 3000;

app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/auth', (req, res) => {
  console.log('/auth');
  getNewToken(res);
});

app.get('/callback', async (req, res) => {
  console.log('/callback');
  const code = req.query.code;
  console.log('code', code);
  try {
    const auth = await oauth2Client.getToken(code);
    authorize(auth);
  } catch (error) {
    console.log('Error in Callback', err);
  }
  res.sendFile(path.join(__dirname + '/public/callback.html'));
});

app.get('/test', (req, res) => {
  getLatestChatId();
  res.end('testing');
});

app.listen(port);

console.log('lisening on', port);
