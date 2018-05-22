const fs = require('fs');
const handlebars = require('../handlebars');

const templates = {};

const asyncRead = path => new Promise(resolve => fs.readFile(path, 'utf8', (err, data) => resolve(data)));

module.exports = {
  async render(key, data = {}) {
    if (!key) throw new Error('"key" parameter is required.');
    if (!templates[key]) {
      const html = await asyncRead(`src/email-templates/${key}.hbs`);
      templates[key] = handlebars.compile(html);
    }
    return templates[key](data);
  },
};
