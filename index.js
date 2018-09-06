const express = require('express');
const path = require('path');
const R = require('ramda');

// Utilities
const util = require('util');
const fs = require('fs');

const app = express();
// Google Stuff
var { google } = require('googleapis');

fs.writeFile('./.env', 'Hey there!', err => {
  if (err) {
    return console.log(err);
  }

  console.log('The file was saved!');
});

const OAuth2 = google.auth.OAuth2;

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl'
];
const clientId =
  '304825942443-inmmg9cud04tv1uie1k5avdcqss7h53o.apps.googleusercontent.com';
const clientSecret = '1zMRJ1cgLXJUx4JtT1PCAArZ';
const redirectUrl = 'http://localhost:3000/callback';
const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
oauth2Client.on('tokens', tokens => {
  if (tokens.refresh_token) {
    // store the refresh_token in my database!
    console.log(tokens.refresh_token);
  }
  console.log(tokens.access_token);
});

let chatId;

const port = 3000;

const getChatMessages = liveChatId => {
  const service = google.youtube('v3');
  service.liveChatMessages
    .list({
      auth: oauth2Client,
      part: 'snippet',
      liveChatId
    })
    .then(response => {
      const comments = response.data.items;
      console.log(comments[0]);
      console.log('comments ids', R.pluck('id', comments));
    })
    .catch(err => {
      console.log('The API returned an error: ' + err);
      console.log(util.inspect(err, false, null));
      return;
    });
};

const listLiveBroadCasts = auth => {
  const service = google.youtube('v3');
  service.liveBroadcasts
    .list({
      auth,
      part: 'snippet',
      mine: true
    })
    .then(response => {
      chatId = R.path(['data', 'items', 0, 'snippet', 'liveChatId'], response);
      console.log('chatId', chatId);
      getChatMessages(chatId);
    })
    .catch(err => console.log('err', err));
};

const authorize = auth => {
  oauth2Client.setCredentials(auth.tokens);

  console.log('Successfully authed');
  listLiveBroadCasts(oauth2Client);
};

const getNewToken = res => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'online',
    scope: SCOPES
  });
  res.redirect(authUrl);
};

app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/auth', (req, res) => {
  console.log('/auth');
  getNewToken(res);
});

app.get('/callback', (req, res) => {
  console.log('/callback');
  const code = req.query.code;
  console.log('code', code);
  oauth2Client
    .getToken(code)
    .then(authorize)
    .catch(err => console.log('err', err));
  res.sendFile(path.join(__dirname + '/public/callback.html'));
});

app.listen(port);

console.log('lisening on', port);
