const R = require('ramda');
const { google } = require('googleapis');
var request = require('request-promise');

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
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUrl = process.env.REDIURECT_URL;
const auth = new OAuth2(clientId, clientSecret, redirectUrl);
const service = google.youtube('v3');

const sendCommand = command => {
  const options = {
    method: 'POST',
    uri: `${process.env.REMOTE_URL}:5000/move`,
    body: { direction: command },
    json: true
  };
  request(options)
    .then(function(res) {
      console.log('command res', res);
    })
    .catch(function(err) {
      console.log('cp,,amd err', err);
    });
};

auth.on('tokens', tokens => {
  if (tokens.refresh_token) {
    // store the refresh_token in my database!
    console.log('refreshing token');
    console.log(tokens.refresh_token);
  }
  console.log(tokens.access_token);
});

let liveChatId;
let nextPage;
const intervalTime = 3500;
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
    left: 0,
    right: 0,
    up: 0,
    down: 0,
    forward: 0,
    backward: 0
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
  sendCommand(outputCommand);
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

const startMessageInterval = async () => {
  if (!liveChatId) {
    await getLatestChatId();
  }
  if (!liveChatId) {
    return console.log('No liveChatId available');
  }
  interval = setInterval(getChatMessages, intervalTime);
};

const stopMessageInterval = () => {
  clearInterval(interval);
};

const getLatestChatId = async res => {
  const response = await service.liveBroadcasts.list({
    auth,
    part: 'snippet',
    mine: true
  });
  const liveBroadcasts = response.data.items;
  const latestChat = response.data.items[0];
  liveChatId = latestChat.snippet.liveChatId;
  const msg = `Latest chat ID: ${liveChatId}`;
  if (res) {
    res.end(msg);
  }
  console.log(msg);
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

const checkAuth = async tokens => {
  console.log('checking auth');
  // const tokens = await read('./tokens.json');
  if (tokens) {
    console.log('token set');
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

module.exports = {
  getChatMessages,
  getLatestChatId,
  getNewToken,
  setAuth,
  startMessageInterval,
  stopMessageInterval,
  checkAuth
};
