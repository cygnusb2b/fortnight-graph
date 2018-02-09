const faker = require('faker');

module.exports = () => ({
  title: faker.company.catchPhrase(),
  teaser: faker.company.bsBuzz(),
});
