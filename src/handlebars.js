const handlebars = require('handlebars');
const moment = require('moment');
const containerAttributes = require('./delivery/container-attributes');
const trackedLinkAttributes = require('./delivery/tracked-link-attributes');
const buildAttrs = require('./delivery/build-attrs');

handlebars.registerHelper('moment-format', (date, format) => moment(date).format(format));
handlebars.registerHelper('get-timestamp', () => (new Date()).getTime());

handlebars.registerHelper('build-container-attributes', (context) => {
  const { data = {} } = context;
  const { root } = data;

  const attrs = containerAttributes(root, true);
  return new handlebars.SafeString(attrs);
});

handlebars.registerHelper('tracked-link', function trackedLink(context) {
  const { hash, data = {} } = context;
  const { root } = data;

  const attrs = trackedLinkAttributes(root, false);
  Object.keys(hash).forEach((name) => {
    attrs[name] = hash[name];
  });
  return new handlebars.SafeString(`<a ${buildAttrs(attrs)}>${context.fn(this)}</a>`);
});

/**
 * No longer tracking loads in this manner.
 * @deprecated
 */
handlebars.registerHelper('build-beacon', () => new handlebars.SafeString(''));

handlebars.registerHelper('link-to', (...parts) => parts.filter(el => typeof el === 'string').join('/'));

module.exports = handlebars;
