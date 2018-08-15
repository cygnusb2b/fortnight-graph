const { JWT } = require('googleapis').google.auth;
const env = require('../../env');

// eslint-disable-next-line camelcase
const { client_email, private_key } = env.GOOGLE_APPLICATION_CREDENTIALS;

/**
 *
 * @async
 * @param {Array} endpoints Google API endpoints to be authorized for this client
 */
module.exports = async (endpoints = []) => {
  const client = new JWT(client_email, null, private_key, endpoints);
  return new Promise((resolve, reject) => {
    client.authorize(err => (err ? reject(err) : resolve()));
  }).then(() => client);
};
