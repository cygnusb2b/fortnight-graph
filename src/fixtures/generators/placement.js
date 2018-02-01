const shortid = require('shortid');
const faker = require('faker');

const template = `
<h1><a href="{{ url }}" title="{{ title }}">{{ title }}</a></h1>
<p>{{ teaser }} - {{ c.customVar }}</p>
`;

module.exports = ({ publisherId }) => ({
  name: faker.random.words(),
  pid: shortid.generate(),
  template,
  createdAt: faker.date.past().valueOf(),
  updatedAt: faker.date.recent().valueOf(),
  publisherId: publisherId(),
});
