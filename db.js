var MongoClient = require('mongodb').MongoClient;
const { checkAuth } = require('./youtubeService');

const connect = app => {
  MongoClient.connect(
    process.env.MONGODB_URI,
    { useNewUrlParser: true },
    function(err, db) {
      if (err) throw err;
      console.log('Database connected!');
      app.emit('ready');
      var dbo = db.db('heroku_t226sql1');
      dbo.collection('tokens').findOne({}, function(err, result) {
        if (err) throw err;
        console.log('token found', result);
        checkAuth(result);
        db.close();
      });
    }
  );
};

module.exports = connect;
