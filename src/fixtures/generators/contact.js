const faker = require('faker');

module.exports = async ({ createdById, updatedById }) => {
  const givenName = faker.name.firstName();
  const familyName = faker.name.lastName();
  return {
    email: faker.internet.email(),
    givenName,
    familyName,
    name: `${givenName} ${familyName}`,
    createdById: await createdById(),
    updatedById: await updatedById(),
  };
};
