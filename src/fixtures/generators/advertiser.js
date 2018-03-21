const faker = require('faker');

module.exports = ({ internalContactIds = [], externalContactIds = [] }) => {
  const now = new Date();

  return {
    name: faker.company.companyName(),
    createdAt: now,
    updatedAt: now,
    notify: {
      internal: internalContactIds,
      external: externalContactIds,
    },
  };
};
