const faker = require('faker');

module.exports = () => {
  const now = new Date();
  return {
    email: faker.internet.email(),
    password: faker.internet.password(8, true),
    givenName: faker.name.firstName(),
    familyName: faker.name.lastName(),
    logins: faker.random.number({ min: 0, max: 100 }),
    lastLoggedInAt: faker.date.past(),
    isEmailVerified: faker.random.boolean(),
    role: faker.random.arrayElement(['Member', 'Admin']),
    photoURL: faker.internet.avatar(),
    createdAt: now,
    updatedAt: now,
  };
};
