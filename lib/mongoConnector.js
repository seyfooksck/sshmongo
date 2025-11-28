const mongoose = require('mongoose');

async function connectViaMongoose({ localPort, dbName = '', mongooseOptions }) {
  const uri = `mongodb://127.0.0.1:${localPort}/${dbName}`;
  await mongoose.connect(uri, Object.assign({ useNewUrlParser: true, useUnifiedTopology: true }, mongooseOptions || {}));
  return { mongoose, connection: mongoose.connection, uri };
}

module.exports = { connectViaMongoose };
