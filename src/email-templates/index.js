const handlebars = require('handlebars');
const moment = require('moment');
const fs = require('fs');

const baseUri = process.env.BASE_URL || 'https://fortnight.as3.io/manage';

handlebars.registerHelper('moment-format', (date, format) => moment(date).format(format));
handlebars.registerHelper('link-to', (...parts) => {
  const rest = parts.filter(el => typeof el === 'string').join('/');
  return `${baseUri}/${rest}`;
});

const templates = {};

module.exports = {
  render(type = 'internal', key, data = {}) {
    const ref = `${type}.${key}`;
    if (!templates[ref]) {
      const html = fs.readFileSync(`src/email-templates/${type}/${key}.hbs`, 'utf8');
      templates[ref] = handlebars.compile(html);
    }
    return templates[ref](data);
  },
};
