const faker = require('faker');

module.exports = () => {
  const givenName = faker.name.firstName();
  const familyName = faker.name.lastName();
  return {
    email: faker.internet.email(),
    givenName,
    familyName,
    name: `${givenName} ${familyName}`,
  };
};
