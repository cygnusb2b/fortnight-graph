const faker = require('faker');

module.exports = async ({
  publisherId,
  templateId,
  topicId,
  createdById,
  updatedById,
} = {}) => {
  const now = new Date();
  return {
    name: faker.lorem.words(10),
    createdAt: now,
    updatedAt: now,
    publisherId: await publisherId(),
    templateId: await templateId(),
    topicId: await topicId(),
    createdById: await createdById(),
    updatedById: await updatedById(),
  };
};
