const Promise = require('bluebird');
const fixtures = require('./index');
const models = require('../models');

const create = async (Model, count, params) => {
  const results = fixtures(Model, count, params);
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
    return create(Advertiser, count);
  },

  /**
   * @param {number} count
   */
  async campaigns(count) {
    const { Campaign } = models;
    const advertiser = await this.advertisers(1);
    const placements = await this.placements(2);
    const image = await this.images(1);
    const params = {
      advertiserId: () => advertiser.id,
      placementIds: () => placements.map(placement => placement.id),
      creativeImageId: () => image.id,
    };
    return create(Campaign, count, params);
  },

  /**
   * @param {number} count
   */
  async contacts(count) {
    const { Contact } = models;
    return create(Contact, count);
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
    const template = await this.templates(1);
    const topic = await this.topics(1);
    const params = {
      templateId: () => template.id,
      publisherId: () => topic.publisherId,
      topicId: () => topic.id,
    };
    return create(Placement, count, params);
  },

  /**
   * @param {number} count
   */
  async publishers(count) {
    const { Publisher } = models;
    return create(Publisher, count);
  },

  /**
   * @param {number} count
   */
  async stories(count) {
    const { Story } = models;
    const advertiser = await this.advertisers(1);
    const images = await this.images(3);
    const params = {
      advertiserId: () => advertiser.id,
      primaryImageId: () => images[0].id,
      imageIds: () => images.map(image => image.id),
    };
    return create(Story, count, params);
  },

  /**
   * @param {number} count
   */
  async templates(count) {
    const { Template } = models;
    return create(Template, count);
  },

  /**
   * @param {number} count
   */
  async topics(count) {
    const { Topic } = models;
    const publisher = await this.publishers(1);
    const params = {
      publisherId: () => publisher.id,
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
