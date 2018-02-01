const faker = require('faker');

module.exports = () => ({
  name: faker.company.companyName(),
  createdAt: faker.date.past().valueOf(),
  updatedAt: faker.date.recent().valueOf(),
});
