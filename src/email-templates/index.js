const Promise = require('bluebird');
const handlebars = require('../handlebars');

const templates = {};

const readFileAsync = Promise.promisify(require('fs').readFile);

module.exports = {
  readFileAsync,
  async render(key, data = {}) {
    if (!key) throw new Error('"key" parameter is required.');
    if (!templates[key]) {
      const html = await this.readFileAsync(`src/email-templates/${key}.hbs`, 'utf8');
      templates[key] = handlebars.compile(html);
    }
    return templates[key](data);
  },
};
