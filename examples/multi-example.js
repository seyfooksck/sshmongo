// Multi-SSH example for sshmongo
// Demonstrates opening multiple SSH tunnels (primary + backups) and using the primary for mongoose.
// WARNING: Inline credentials below are for quick tests only — do NOT commit real secrets.
const { connect } = require('..');

(async () => {
  // Define multiple SSH servers: first is primary
  const sshServers = [
    { host: 'primary.seyfooksck.dev', port: 22, username: 'root', password: '123456789' },
    { host: 'backup1.seyfooksck.dev',  port: 22, username: 'root', password: '123456789' },
    { host: 'backup2.seyfooksck.dev',  port: 22, username: 'root', password: '123456789' }
  ];

  const mongo = { host: '127.0.0.1', port: 27017, dbName: 'seyfooksck' };

  try {
    const { mongoose, tunnels, close, closeBackups, localPort } = await connect({ ssh: sshServers, mongo });

    console.log('Opened tunnels count:', tunnels.length);
    console.log('Primary local port (mongoose connected):', localPort);

    // Do primary DB work via mongoose
    const Item = mongoose.model('Item', { name: String });
    await Item.create({ name: 'FromPrimary' });
    console.log('Primary items:', await Item.find().lean());

    // Example: if you want to close backup tunnels to save resources
    // closeBackups();

    // Full shutdown when done
    await close();
    console.log('All tunnels closed');
  } catch (err) {
    console.error('Multi-SSH example error:', err);
    process.exit(1);
  }

})();
