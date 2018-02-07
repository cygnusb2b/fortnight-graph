const faker = require('faker');
const shortid = require('shortid');

module.exports = () => ({
  uid: shortid.generate(),
  email: faker.internet.email(),
  password: faker.internet.password(null, true),
  givenName: faker.name.firstName(),
  familyName: faker.name.lastName(),
  logins: faker.random.number(),
  lastLoggedInAt: faker.date.past().valueOf(),
  isEmailVerified: faker.random.boolean(),
  role: faker.random.arrayElement(['Member', 'Admin']),
  photoURL: faker.internet.avatar(),
});
