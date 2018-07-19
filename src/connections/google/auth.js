const { JWT } = require('googleapis').google.auth;
const { client_email, private_key } = require('../../env').GOOGLE_APPLICATION_CREDENTIALS; // eslint-disable-line camelcase

/**
 *
 * @param {Array} endpoints Google API endpoints to be authorized for this client
 * @returns JWT
 */
module.exports = async (endpoints = []) => {
  const client = new JWT(client_email, null, private_key, endpoints);
  await client.authorize((err) => {
    if (err) return Promise.reject(err);
    return Promise.resolve();
  });
  return client;
};
