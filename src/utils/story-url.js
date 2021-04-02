const querystring = require('querystring');
const connection = require('../connections/mongoose/instance');
const accountService = require('../services/account');

module.exports = async (story, params) => {
  const [
    account,
    publisher,
    path,
  ] = await Promise.all([
    accountService.retrieve(),
    connection.model('publisher').findById(story.publisherId),
    story.getPath(),
  ]);
  const uri = publisher.customUri || account.storyUri;
  const url = `${uri.replace(/\/+$/g, '')}/${path.replace(/^\/+/g, '').replace(/\/+$/g, '')}`;
  if (params && typeof params === 'object') {
    return `${url}/?${querystring.stringify(params)}`;
  }
  return url;
};
