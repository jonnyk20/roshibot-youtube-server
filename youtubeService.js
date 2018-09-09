const R = require('ramda');
const { google } = require('googleapis');

// Utilities
const util = require('util');
const fs = require('fs');

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const print = (label, data) =>
  console.log(label, util.inspect(data, false, null));

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
    return JSON.parse(content);
  } catch (error) {
    console.log('Error Reading:', error);
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
const auth = new OAuth2(clientId, clientSecret, redirectUrl);
const service = google.youtube('v3');
auth.on('tokens', tokens => {
  if (tokens.refresh_token) {
    // store the refresh_token in my database!
    console.log('refreshing token');
    console.log(tokens.refresh_token);
  }
  console.log(tokens.access_token);
});

let liveChatId = 'Cg0KC3ZVanc5Y0toQjdV';
let nextPage;
const intervalTime = 5000;
let interval;

const processNewComments = comments => {
  const commentTexts = R.map(
    R.pipe(
      R.path(['snippet', 'displayMessage']),
      R.toLower
    ),
    comments
  );
  // Todo: account for aliases and typos
  const directionsCount = {
    up: 0,
    down: 0,
    left: 0,
    right: 0,
    forward: 0,
    back: 0
  };
  let commandOrder = [];
  commentTexts.forEach(comment => {
    if (directionsCount[comment] >= 0) {
      directionsCount[comment] = directionsCount[comment] + 1;
      commandOrder = commandOrder.filter(command => command !== comment);
      commandOrder.push(comment);
    }
  });

  const rankedDirections = Object.keys(directionsCount)
    .sort((a, b) => {
      return directionsCount[b] - directionsCount[a];
    })
    .map(direction => {
      return {
        direction,
        count: directionsCount[direction],
        order: commandOrder.indexOf(direction)
      };
    });
  if (R.isEmpty(commandOrder)) {
    console.log('no commands given');
    return;
  }
  const outputCommand = rankedDirections.reduce(
    (acc, commandObj) => {
      if (commandObj.count > acc.count) {
        return commandObj;
      }
      if (commandObj.count < acc.count) {
        return acc;
      }
      return commandObj.order > acc.order ? commandObj : acc;
    },
    { count: 0, order: -1, direction: null }
  ).direction;

  print('outputCommand', outputCommand);
};

const getChatMessages = async () => {
  try {
    const response = await service.liveChatMessages.list({
      auth,
      part: 'snippet',
      liveChatId,
      pageToken: nextPage
    });
    const { data } = response;
    const comments = data.items;
    processNewComments(comments);
    nextPage = data.nextPageToken;
  } catch (error) {
    console.log('Error getting chat messages: ' + error);
  }
};

const startMessageInterval = () => {
  interval = setInterval(getChatMessages, intervalTime);
};

const stopMessageInterval = () => {
  clearInterval(interval);
};

const getLatestChatId = async () => {
  const response = await service.liveBroadcasts.list({
    auth,
    part: 'snippet',
    mine: true
  });
  const latestChat = response.data.items[0];
  liveChatId = latestChat.snippet.liveChatId;
  console.log('snippet', latestChat.snippet);
  console.log('liveChatId', liveChatId);
  console.log('Error fetching broadcasts', error);
};

const authorize = ({ tokens }) => {
  save('./tokens.json', JSON.stringify(tokens));
  auth.setCredentials(tokens);
  console.log('Successfully authed');
};

const getNewToken = res => {
  const authUrl = auth.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  res.redirect(authUrl);
};

const checkAuth = async () => {
  const tokens = await read('./tokens.json');
  if (tokens) {
    auth.setCredentials(tokens);
  } else {
    console.log('no tokens set');
  }
};

const setAuth = async code => {
  console.log('setting Auth');
  const credentials = await auth.getToken(code);
  authorize(credentials);
};

checkAuth();

module.exports = {
  getChatMessages,
  getLatestChatId,
  getNewToken,
  setAuth,
  startMessageInterval,
  stopMessageInterval
};
