const Promise = require('bluebird');
const fs = require('fs');
const handlebars = require('../handlebars');
const accountService = require('../services/account');

const templates = {};

const readFileAsync = Promise.promisify(fs.readFile);

module.exports = {
  readFileAsync,
  async render(key, data = {}) {
    if (!key) throw new Error('"key" parameter is required.');
    if (!templates[key]) {
      const html = await this.readFileAsync(`src/email-templates/${key}.hbs`, 'utf8');
      templates[key] = handlebars.compile(html);
    }
    const account = await accountService.retrieve();
    return templates[key]({
      ...data,
      account,
    });
  },
};
