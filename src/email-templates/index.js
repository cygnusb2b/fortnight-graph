const fs = require('fs');
const handlebars = require('../handlebars');

const templates = {};

module.exports = {
  render(key, data = {}) {
    if (!templates[key]) {
      const html = fs.readFileSync(`src/email-templates/${key}.hbs`, 'utf8');
      templates[key] = handlebars.compile(html);
    }
    return templates[key](data);
  },
};
