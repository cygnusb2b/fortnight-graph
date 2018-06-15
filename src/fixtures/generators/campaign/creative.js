const faker = require('faker');

module.exports = ({ imageId }) => ({
  title: faker.company.catchPhrase(),
  teaser: faker.lorem.sentences(),
  imageId: imageId(),
});
