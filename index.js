const express = require('express');
const path = require('path');
const app = express();

// Utilities
const util = require('util');
const fs = require('fs');

// Google Stuff
var { google } = require('googleapis');

fs.writeFile('./.env', 'Hey there!', function(err) {
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
let code =
  '4/UQDbyQ-erDwPPmj53lG5haS4T8xWXbdHde0MScSiw_v-Z1WBdv3i8KiYx1bJde5KVR_XRLnsK6StRmtn4TLWaGY';

const port = 3000;

const getNewToken = res => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'online',
    scope: SCOPES
  });
  res.redirect(authUrl);
};

function getChannel(auth) {
  var service = google.youtube('v3');
  service.channels.list(
    {
      auth: auth,
      part: 'snippet,contentDetails,statistics',
      forUsername: 'GoogleDevelopers'
    },
    function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      var channels = response.data.items;
      if (channels.length == 0) {
        console.log('No channel found.');
      } else {
        console.log(
          "This channel's ID is %s. Its title is '%s', and " +
            'it has %s views.',
          channels[0].id,
          channels[0].snippet.title,
          channels[0].statistics.viewCount
        );
        commentThreadsListByVideoId(auth);
      }
    }
  );
}

app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/auth', (req, res) => {
  console.log('/auth');
  getNewToken(res);
});

app.get('/callback', (req, res) => {
  console.log('/callback');
  const code = req.query.code;
  console.log(util.inspect(req.query, false, null));
  oauth2Client.getToken(code, function(err, token) {
    if (err) {
      console.log('Error while trying to retrieve access token', err);
      return;
    }
    oauth2Client.credentials = token;
    console.log('Successfully authed');
  });
  res.sendFile(path.join(__dirname + '/public/callback.html'));
});

app.listen(port);

console.log('lisening on', port);
