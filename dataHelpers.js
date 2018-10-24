// Defines helper functions for saving and getting data from the mongodb
module.exports = function dataHelpers(db) {
  return {
    checkTokens: () =>
      db.collection('tokens').findOne({}),
    saveTokens: (tokens) =>
      db.collection('tokens').updateOne({}, { "$set": tokens })
    // checkTokens: function (roomObj, callback) {
    //   db.collection("rooms").updateOne({"room_id": roomObj.room_id}, { "$set": roomObj }, { upsert: true }, (err, result) => {
    //     callback(err, result);
    //   });
    // },
  };
};
