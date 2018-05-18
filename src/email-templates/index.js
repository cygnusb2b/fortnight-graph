const fs = require('fs');
const handlebars = require('../handlebars');

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
