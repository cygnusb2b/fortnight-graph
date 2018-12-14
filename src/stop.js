const { write } = require('./output');

module.exports = (promise, name) => {
  write(`> Disconnecting from ${name}...`);
  return promise.then((r) => {
    write(`> ${name} disconnected`);
    return r;
  });
};
