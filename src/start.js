const { write } = require('./output');

module.exports = (promise, name, url) => {
  write(`> Connecting to ${name}...`);
  return promise.then((r) => {
    const u = typeof url === 'function' ? url(r) : url;
    write(`> ${name} connected ${u ? `(${u})` : ''}`);
    return r;
  });
};
