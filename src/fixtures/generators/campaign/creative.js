const faker = require('faker');

module.exports = async ({ imageId }) => ({
  title: faker.company.catchPhrase(),
  teaser: faker.lorem.sentences(),
  imageId: await imageId(),
});
