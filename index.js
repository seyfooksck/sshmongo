const { createTunnel } = require('./lib/sshTunnel');
const { connectViaMongoose } = require('./lib/mongoConnector');

/**
 * Connect to a remote MongoDB over SSH and return mongoose connection helpers.
 *
 * options: {
 *   ssh: { host, port?, username, password?, privateKeyPath? }
 *   mongo: { host?, port?, dbName?, localPort? }
 *   mongooseOptions?: {}
 * }
 */
async function connect(options = {}) {
  if (!options.ssh) throw new Error('Missing ssh options');
  if (!options.mongo) throw new Error('Missing mongo options');
  // Support single ssh config or array of ssh configs (multi-SSH)
  const sshConfigs = Array.isArray(options.ssh) ? options.ssh : [options.ssh];

  // Open tunnels for all provided SSH configs in parallel
  const tunnels = await Promise.all(sshConfigs.map(cfg => createTunnel({
    ssh: cfg,
    dstHost: options.mongo.host || '127.0.0.1',
    dstPort: options.mongo.port || 27017,
    localPort: cfg.localPort || options.mongo.localPort
  })));

  // tunnels: array of { server, sshConnection, localPort }
  // Use the first tunnel as primary for mongoose connection by default
  const primary = tunnels[0];

  const conn = await connectViaMongoose({
    localPort: primary.localPort,
    dbName: options.mongo.dbName || '',
    mongooseOptions: options.mongooseOptions
  });

  async function closeAll() {
    try { await conn.mongoose.disconnect(); } catch (e) { /* ignore */ }
    // Close all SSH connections and servers
    for (const t of tunnels) {
      try { if (t.sshConnection && typeof t.sshConnection.end === 'function') t.sshConnection.end(); } catch (e) { /* ignore */ }
      try { if (t.server && typeof t.server.close === 'function') t.server.close(); } catch (e) { /* ignore */ }
    }
  }

  // Helper to close only backup tunnels (not primary) if needed
  function closeBackups() {
    for (let i = 1; i < tunnels.length; i++) {
      const t = tunnels[i];
      try { if (t.sshConnection && typeof t.sshConnection.end === 'function') t.sshConnection.end(); } catch (e) { /* ignore */ }
      try { if (t.server && typeof t.server.close === 'function') t.server.close(); } catch (e) { /* ignore */ }
    }
  }

  return Object.assign(conn, { tunnels, close: closeAll, closeBackups, localPort: primary.localPort });
}

module.exports = { connect };
