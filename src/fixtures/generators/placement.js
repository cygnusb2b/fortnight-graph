const faker = require('faker');

const template = `
<h1><a href="{{ url }}" title="{{ title }}">{{ title }}</a></h1>
<p>{{ teaser }} - {{ c.customVar }}</p>
`;

module.exports = ({ publisherId } = {}) => {
  const now = new Date();
  return {
    name: faker.random.words(),
    template,
    createdAt: now,
    updatedAt: now,
    publisherId: publisherId(),
  };
};
