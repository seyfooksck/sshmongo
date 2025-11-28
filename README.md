
 # sshmongo

Description
-----------
This package opens SSH tunnels to remote servers and connects to MongoDB over those tunnels using `mongoose`. It uses `tunnel-ssh` to forward the remote MongoDB port to a local port and then connects `mongoose` to that local port.

Purpose
-------
Provide a small helper for projects that need to access a remote MongoDB securely over SSH without exposing the remote MongoDB port directly.

Contents
--------
- Installation
- Quick start
- API reference
- Examples (single and multi-SSH)
- Cleanup
- Security notes
- Troubleshooting

Installation
------------
Install dependencies from the project root:

```cmd
cd /d f:\Module\mongo-ssh
npm install
```

Note: this project depends on `tunnel-ssh`, `get-port` and `mongoose`.

Quick start
-----------
1. Edit `examples/example.js` or use the `connect` API directly in your application.
2. Ensure SSH access is available and remote MongoDB is reachable from the SSH host (commonly `127.0.0.1:27017`).
3. Run the example:

```cmd
node examples/example.js
```

If successful you will see the local tunnel port, the mongoose URI and example DB operations in the console.

API reference
-------------

- `const { connect } = require('./index.js')`
- `await connect(options)` — opens SSH tunnel(s), connects `mongoose` and returns helper objects.

connect(options) short description:

- `options.ssh` — SSH connection info. Either a single object or an array of objects.
  Example:

  ```js
  {
    host: 'ssh.example.com',
    port: 22,
    username: 'root',
    // authentication: either password or privateKey/privateKeyPath
    password: 'mypassword',
    // or
    privateKeyPath: '/home/user/.ssh/id_rsa'
  }
  ```

- `options.mongo` — remote Mongo target (as seen from SSH host):

  ```js
  { host: '127.0.0.1', port: 27017, dbName: 'mydb', localPort: 27000 /* optional */ }
  ```

- `options.mongooseOptions` — optional options for `mongoose.connect`.

Return value: an object with

- `{ mongoose, connection, uri, localPort, tunnels, close, closeBackups }`

- Call `close()` to disconnect `mongoose` and shut down all SSH tunnels.

Examples
--------

Single (inline test — do not commit secrets):

```js
const { connect } = require('..');

(async () => {
  const ssh = { host: 'vds.example.dev', port: 22, username: 'root', password: 'TEST_PASSWORD' };
  const mongo = { host: '127.0.0.1', port: 27017, dbName: 'test' };

  const { mongoose, localPort, uri, close } = await connect({ ssh, mongo });
  console.log('Connected to', uri);

  const Cat = mongoose.model('Cat', { name: String });
  await Cat.create({ name: 'Whiskers' });
  console.log(await Cat.find().lean());

  await close();
})();
```

Multi-SSH (primary + backups)
-----------------------------
Pass an array of SSH configurations in `options.ssh`. The first entry will be used as the primary tunnel for mongoose; additional entries will open backup tunnels. The returned object includes `tunnels` array and helpers.

```js
const { connect } = require('..');

(async () => {
  const sshServers = [
    { host: 'primary.example.dev', port: 22, username: 'root', password: 'PRIMARY_PASS' },
    { host: 'backup1.example.dev',  port: 22, username: 'root', password: 'BACKUP1_PASS' },
    { host: 'backup2.example.dev',  port: 22, username: 'root', password: 'BACKUP2_PASS' }
  ];

  const mongo = { host: '127.0.0.1', port: 27017, dbName: 'mydb' };

  const { mongoose, tunnels, close, closeBackups } = await connect({ ssh: sshServers, mongo });
  console.log('Opened tunnels count:', tunnels.length);
  console.log('Primary local port:', tunnels[0].localPort);

  // Work on primary via mongoose

  // Optionally close backup tunnels to save resources:
  // closeBackups();

  await close();
})();
```

Returned helpers:

- `tunnels`: array of `{ server, sshConnection, localPort }` for each opened tunnel
- `closeBackups()`: close only backup tunnels (all except primary)
- `close()`: close all tunnels and disconnect mongoose

Cleanup
-------
Call the returned `close()` method to disconnect mongoose and stop SSH tunnels:

```js
await close();
```

Add signal handlers to ensure cleanup on process exit (SIGINT, SIGTERM):

```js
process.on('SIGINT', async () => {
  await close();
  process.exit(0);
});
```

Security notes
--------------
- Do not hardcode secrets (SSH passwords or private keys) in source.
- Inline test credentials are for local testing only — use environment variables, `.env` + `dotenv`, or a secrets manager for production.
- Protect private keys with correct filesystem permissions (e.g. `600`).

Troubleshooting
---------------

- `privateKeyPath not found`: the `ssh.privateKeyPath` file was not found.
- `ECONNREFUSED` or connection errors: verify SSH access and that MongoDB is reachable from the SSH host (commonly `127.0.0.1:27017`).
- `tunnel is not a function` or API errors: check `tunnel-ssh` version in `package.json`. For 5.x use `createTunnel` API.

Development and testing
-----------------------
- Use `examples/example.js` and `examples/multi-example.js` for quick local testing.
- I can add a basic test suite and GitHub Actions workflow on request.

Contributing
------------

1. Fork
2. Create a branch
3. Open a PR

License
-------

MIT
  // Optionally close backup tunnels to save resources:
