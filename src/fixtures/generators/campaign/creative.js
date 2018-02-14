const faker = require('faker');
const image = require('./image');

module.exports = () => ({
  title: faker.company.catchPhrase(),
  teaser: faker.lorem.sentences(),
  image: image(),
});
