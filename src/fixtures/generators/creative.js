const faker = require('faker');

module.exports = () => ({
  name: faker.random.words(),
  url: faker.internet.url(),
  title: faker.company.catchPhrase(),
  teaser: faker.company.bsBuzz(),
  image: faker.image.imageUrl(),
});
