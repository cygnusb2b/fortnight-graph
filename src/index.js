require('dotenv').config();

const initDb = require('./db');
const redis = require('./redis');
const pkg = require('../package.json');
const app = require('./app');

const { PORT, REDIS_DSN } = process.env;

initDb();

redis.use('session', { url: REDIS_DSN, prefix: `${pkg.name}:session:` });

app.listen(PORT);
process.stdout.write(`Express app '${pkg.name}' listening on port ${PORT}\n`);
