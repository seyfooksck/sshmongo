const fs = require('fs');
const tunnel = require('tunnel-ssh');
const getPort = require('get-port');

async function createTunnel({ ssh, dstHost = '127.0.0.1', dstPort = 27017, localPort }) {
  const port = localPort || await getPort();

  // Build parameters for tunnel-ssh v5 createTunnel(tunnelOptions, serverOptions, sshOptions, forwardOptions)
  const tunnelOptions = { autoClose: false, reconnectOnError: false };
  const serverOptions = { port, host: '127.0.0.1' };
  const sshOptions = Object.assign({ port: ssh.port || 22, username: ssh.username, host: ssh.host, readyTimeout: ssh.readyTimeout || 20000 }, {});

  if (ssh.privateKeyPath) {
    if (fs.existsSync(ssh.privateKeyPath)) {
      sshOptions.privateKey = fs.readFileSync(ssh.privateKeyPath);
    } else {
      if (ssh.password) {
        console.warn(`privateKeyPath not found (${ssh.privateKeyPath}), falling back to password authentication.`);
      } else {
        throw new Error(`privateKeyPath not found: ${ssh.privateKeyPath}. Provide a valid path or set 'password' or 'privateKey' in ssh options.`);
      }
    }
  }
  if (ssh.privateKey) sshOptions.privateKey = ssh.privateKey;
  if (ssh.password) sshOptions.password = ssh.password;

  const forwardOptions = { dstAddr: dstHost, dstPort };

  try {
    const result = await tunnel.createTunnel(tunnelOptions, serverOptions, sshOptions, forwardOptions);
    // createTunnel resolves to [server, sshConnection]
    const serverInstance = Array.isArray(result) ? result[0] : result[0];
    const sshConnection = Array.isArray(result) ? result[1] : result[1];
    return { server: serverInstance, sshConnection, localPort: port };
  } catch (err) {
    throw err;
  }
}

module.exports = { createTunnel };
