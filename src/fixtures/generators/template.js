const faker = require('faker');

const html = `
  <div>
    <h1>{{ creative.title }}</h1>
    <p>{{ campaign.createdAt }}</p>
  </div>
`;

const fallback = `
<div>
  <h1>{{ creative.title }}</h1>
  <p>{{ campaign.createdAt }}</p>
  <p>{{ c.customVar }}</p>
</div>
`;

module.exports = () => {
  const now = new Date();
  return {
    name: faker.random.words(),
    html,
    fallback,
    createdAt: now,
    updatedAt: now,
  };
};
