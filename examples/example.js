// Single-connection example for sshmongo
// This file demonstrates a simple, single SSH -> MongoDB connection
// NOTE: This is a test/example file. Do NOT commit real credentials to version control.
const { connect } = require('..');

(async () => {
  // Inline test credentials (replace with your test values)
  const ssh = {
    host: 'seyfooksck.dev',
    port: 22,
    username: 'root',
    // either password or privateKeyPath
    password: '123456789'
  };

  const mongo = {
    host: '127.0.0.1',
    port: 27017,
    dbName: 'seyfooksck'
  };

  try {
    const { mongoose, uri, localPort, close } = await connect({ ssh, mongo });
    console.log('Tunnel local port:', localPort);
    console.log('Connected mongoose uri:', uri);

    // Example mongoose usage
    const Cat = mongoose.model('Cat', { name: String });
    await Cat.create({ name: 'Whiskers' });
    const cats = await Cat.find().lean();
    console.log('Cats:', cats);

    // Cleanup
    await close();
    console.log('Closed connection and tunnel');
  } catch (err) {
    console.error('Error connecting via SSH to MongoDB:', err);
    process.exit(1);
  }
})();
