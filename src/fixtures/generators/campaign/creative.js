const faker = require('faker');

module.exports = () => ({
  url: faker.internet.url(),
  title: faker.company.catchPhrase(),
  teaser: faker.company.bsBuzz(),
  image: faker.image.imageUrl(),
});
