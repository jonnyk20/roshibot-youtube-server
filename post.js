var request = require('request-promise');
const options = {
  method: 'POST',
  uri: 'http://192.168.0.17:3000/command',
  body: { color: null },
  json: true
};

request(options)
  .then(function(res) {
    // Process html like you would with jQuery...
    console.log('res', res);
  })
  .catch(function(err) {
    // Crawling failed or Cheerio choked...
    console.log('err', err);
  });
