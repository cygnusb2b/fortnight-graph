const { Strategy } = require('passport-http-bearer');
const UserRepo = require('../repositories/user');

module.exports = new Strategy((token, next) => {
  UserRepo.retrieveSession(token).then(data => next(null, data)).catch(() => {
    next(new Error('No active user session was found. Did you login?'));
  });
});
