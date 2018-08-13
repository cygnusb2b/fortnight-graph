const querystring = require('querystring');

module.exports = (uri, path, params) => {
  const url = `${uri.replace(/\/+$/g, '')}/${path.replace(/^\/+/g, '').replace(/\/+$/g, '')}`;
  if (params && typeof params === 'object') {
    return `${url}/?${querystring.stringify(params)}`;
  }
  return url;
};
