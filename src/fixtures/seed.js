const Promise = require('bluebird');
const fixtures = require('./index');
const models = require('../models');

const create = async (Model, count, params) => {
  const results = await fixtures(Model, count, params);
  if (results.length === 1) {
    const result = results.one();
    await result.save();
    return result;
  }
  await Promise.all(results.all().map(model => model.save()));
  return results.all();
};

module.exports = {
  /**
   * @param {number} count
   */
  async advertisers(count) {
    const { Advertiser } = models;
    const user = await this.users(1);
    const params = {
      updatedById: () => user.id,
      createdById: () => user.id,
    };
    return create(Advertiser, count, params);
  },

  /**
   * @param {number} count
   */
  async campaigns(count) {
    const { Campaign } = models;
    const {
      user,
      advertiser,
      placements,
      image,
    } = await Promise.props({
      user: this.users(1),
      advertiser: this.advertisers(1),
      placements: this.placements(2),
      image: this.images(1),
    });
    const params = {
      advertiserId: () => advertiser.id,
      placementIds: () => placements.map(placement => placement.id),
      creativeImageId: () => image.id,
      updatedById: () => user.id,
      createdById: () => user.id,
    };
    return create(Campaign, count, params);
  },

  /**
   * @param {number} count
   */
  async contacts(count) {
    const user = await this.users(1);
    const params = {
      createdById: () => user.id,
      updatedById: () => user.id,
    };
    const { Contact } = models;
    return create(Contact, count, params);
  },

  /**
   * @param {number} count
   */
  async images(count) {
    const { Image } = models;
    return create(Image, count);
  },

  /**
   * @param {number} count
   */
  async placements(count) {
    const { Placement } = models;
    const user = await this.users(1);
    const topic = await this.topics(1);
    const params = {
      templateId: async () => {
        const template = await this.templates(1);
        return template.id;
      },
      publisherId: () => topic.publisherId,
      topicId: () => topic.id,
      createdById: () => user.id,
      updatedById: () => user.id,
    };
    return create(Placement, count, params);
  },

  /**
   * @param {number} count
   */
  async publishers(count) {
    const user = await this.users(1);
    const params = {
      createdById: () => user.id,
      updatedById: () => user.id,
    };
    const { Publisher } = models;
    return create(Publisher, count, params);
  },

  /**
   * @param {number} count
   */
  async stories(count) {
    const { Story } = models;
    const user = await this.users(1);
    const advertiser = await this.advertisers(1);
    const publisher = await this.publishers(1);
    const images = await this.images(3);
    const params = {
      advertiserId: () => advertiser.id,
      publisherId: () => publisher.id,
      primaryImageId: () => images[0].id,
      imageIds: () => images.map(image => image.id),
      updatedById: () => user.id,
      createdById: () => user.id,
    };
    return create(Story, count, params);
  },

  /**
   * @param {number} count
   */
  async templates(count) {
    const user = await this.users(1);
    const params = {
      createdById: () => user.id,
      updatedById: () => user.id,
    };
    const { Template } = models;
    return create(Template, count, params);
  },

  /**
   * @param {number} count
   */
  async topics(count) {
    const user = await this.users(1);
    const { Topic } = models;
    const publisher = await this.publishers(1);
    const params = {
      publisherId: () => publisher.id,
      createdById: () => user.id,
      updatedById: () => user.id,
    };
    return create(Topic, count, params);
  },

  /**
   * @param {number} count
   */
  async users(count) {
    const { User } = models;
    return create(User, count);
  },
};
