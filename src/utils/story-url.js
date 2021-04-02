const querystring = require('querystring');
const accountService = require('../services/account');

module.exports = async (story, publisher, params) => {
  const [
    account,
    path,
  ] = await Promise.all([
    accountService.retrieve(),
    story.getPath(),
  ]);
  const uri = publisher.customUri || account.storyUri;
  const url = `${uri.replace(/\/+$/g, '')}/${path.replace(/^\/+/g, '').replace(/\/+$/g, '')}`;
  if (params && typeof params === 'object') {
    return `${url}/?${querystring.stringify(params)}`;
  }
  return url;
};
