const R = require('ramda');
const { google } = require('googleapis');

// Utilities
const util = require('util');
const fs = require('fs');

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

const save = async (path, str) => {
  try {
    await writeFile(path, str);
    console.log('Saved!');
  } catch (error) {
    console.log('Error Saving:', error);
  }
};

const read = async path => {
  try {
    const content = await readFile(path);
    const object = JSON.parse(content);
    return object;
    console.log('Object:', object);
  } catch (error) {
    console.log('Error Reading:', error);
    return null;
  }
};

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
const auth = oauth2Client;
const service = google.youtube('v3');
oauth2Client.on('tokens', tokens => {
  if (tokens.refresh_token) {
    // store the refresh_token in my database!
    console.log(tokens.refresh_token);
  }
  console.log(tokens.access_token);
});

let chatId;

const getChatMessages = async liveChatId => {
  try {
    const response = await service.liveChatMessages.list({
      auth: oauth2Client,
      part: 'snippet',
      liveChatId
    });
    const comments = response.data.items;
    console.log('first comment', comments[0]);
  } catch (error) {
    console.log('The API returned an error: ' + error);
  }
};

const getLatestChatId = async () => {
  try {
    const response = await service.liveBroadcasts.list({
      auth,
      part: 'snippet',
      mine: true
    });
    const latestChat = response.data.items[0];
    const chatId = latestChat.snippet.liveChatId;
    console.log(util.inspect(response.data.items, false, null));
    return chatId;
  } catch (error) {
    console.log('Error ferching broadcasts', error);
  }
};

const authorize = ({ tokens }) => {
  save('./tokens.json', JSON.stringify(tokens));
  oauth2Client.setCredentials(tokens);
  console.log('Successfully authed');
};

const getNewToken = res => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  res.redirect(authUrl);
};

const checkAuth = async () => {
  const tokens = await read('./tokens.json');
  if (tokens) {
    oauth2Client.setCredentials(tokens);
  } else {
    console.log('no tokens set');
  }
};

checkAuth();

module.exports = { getChatMessages, getLatestChatId, getNewToken, authorize };
