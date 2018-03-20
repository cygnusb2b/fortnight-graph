const faker = require('faker');

module.exports = () => {
  const now = new Date();
  const notify = () => {
    const stack = [];
    const num = faker.random.number({ min: 1, max: 5 });
    for (let i = 0; i < num; i += 1) {
      const first = faker.name.firstName();
      const last = faker.name.lastName();
      stack.push({
        name: `${first} ${last}`,
        value: faker.internet.email(),
      });
    }
    return stack;
  };

  return {
    name: faker.company.companyName(),
    createdAt: now,
    updatedAt: now,
    notify: {
      internal: notify(),
      external: notify(),
    },
  };
};
