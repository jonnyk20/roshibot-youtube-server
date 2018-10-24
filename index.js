require('dotenv').config();
const express = require('express');
const path = require('path');
const {
  getChatMessages,
  getLatestChatId,
  getNewToken,
  setAuth,
  startMessageInterval,
  stopMessageInterval,
  updateTokens,
} = require('./youtubeService');

var MongoClient = require('mongodb').MongoClient;
MongoClient.connect(
  process.env.MONGODB_URI,
  { useNewUrlParser: true }
).then(db => {
  console.log('Database connected!');
  var dbo = db.db(process.env.database);
  dataHelpers = dataHelpers(dbo);
  dataHelpers.checkTokens().then(tokens => {
    updateTokens(tokens);
  });
  process.on('SIGINT', function () {
    db.close(function () {
      console.log('Closing DB Connection');
      process.exit(0)
    });
  });
})
  .catch(err => {
    console.log('error connecting to database:', err);
  });

let dataHelpers = require('./dataHelpers');
const app = express();

app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/auth', async (req, res) => {
  console.log('/auth');
  const tokens = await getNewToken(res);
  await dataHelpers.saveTokens(tokens);
  res.send("successfully saved tokens")
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
  getLatestChatId(res).catch(console.error);
});

app.get('/messages', (req, res) => {
  getChatMessages();
  res.end('messages');
});

app.listen(process.env.PORT, function () {
  console.log('app is ready and listening on', process.env.PORT);
});