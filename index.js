require('dotenv').config();
const express = require('express');
const path = require('path');
const {
  getChatMessages,
  getLatestChatId,
  getNewToken,
  setAuth,
  startMessageInterval,
  stopMessageInterval
} = require('./youtubeService');

const app = express();
const port = 3000;

app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/auth', (req, res) => {
  console.log('/auth');
  getNewToken(res);
});

app.get('/callback', (req, res) => {
  console.log('/callback');
  const code = req.query.code;
  setAuth(code).catch(console.error);
  res.sendFile(path.join(__dirname + '/public/callback.html'));
});

app.get('/start', (req, res) => {
  startMessageInterval();
  res.end('starting');
});

app.get('/stop', (req, res) => {
  stopMessageInterval();
  res.end('stopped');
});

app.get('/chat', (req, res) => {
  getLatestChatId().catch(console.error);
  res.end('chatId');
});

app.get('/messages', (req, res) => {
  getChatMessages();
  res.end('messages');
});

app.on('ready', function() {
  app.listen(port, function() {
    console.log('app is ready and listening on', port);
  });
});

require('./db')(app);
