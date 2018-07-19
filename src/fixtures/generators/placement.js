const faker = require('faker');

module.exports = ({ publisherId, templatedId, topicId } = {}) => {
  const now = new Date();
  return {
    name: faker.lorem.words(10),
    createdAt: now,
    updatedAt: now,
    publisherId: publisherId(),
    templatedId: templatedId(),
    topicId: topicId(),
  };
};
