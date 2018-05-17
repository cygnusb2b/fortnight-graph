const Promise = require('bluebird');
const Contact = require('../models/contact');
const Pagination = require('../classes/pagination');
const fixtures = require('../fixtures');
const TypeAhead = require('../classes/type-ahead');

module.exports = {
  /**
   *
   * @param {object} payload
   * @return {Promise}
   */
  create(payload = {}) {
    const contact = new Contact(payload);
    return contact.save();
  },

  /**
   *
   * @param {string} id
   * @param {object} payload
   * @param {string} payload.name
   * @return {Promise}
   */
  update(id, { email, givenName, familyName } = {}) {
    if (!id) return Promise.reject(new Error('Unable to update contact: no ID was provided.'));
    const criteria = { _id: id };
    const update = { $set: { email } };
    if (givenName) update.$set.givenName = givenName;
    if (familyName) update.$set.familyName = familyName;
    update.$set.name = `${givenName} ${familyName}`;
    const options = { new: true, runValidators: true };
    return Contact.findOneAndUpdate(criteria, update, options).then((document) => {
      if (!document) throw new Error(`Unable to update contact: no record was found for ID '${id}'`);
      return document;
    });
  },

  /**
   * Find an Contact record by ID.
   *
   * Will return a rejected promise if no ID was provided.
   * Will NOT reject the promise if the record cannnot be found.
   *
   * @param {string} id
   * @return {Promise}
   */
  findById(id) {
    if (!id) return Promise.reject(new Error('Unable to find contact: no ID was provided.'));
    return Contact.findOne({ _id: id });
  },

  /**
   * Find an Contact record by email.
   *
   * Will return a rejected promise if no email was provided.
   * Will NOT reject the promise if the record cannnot be found.
   *
   * @param {string} id
   * @return {Promise}
   */
  findByEmail(email) {
    if (!email) return Promise.reject(new Error('Unable to find contact: no email was provided.'));
    return Contact.findOne({ email });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  find(criteria) {
    return Contact.find(criteria);
  },

  /**
   * @param {string} id
   * @return {Promise}
   */
  removeById(id) {
    if (!id) return Promise.reject(new Error('Unable to remove contact: no ID was provided.'));
    return this.remove({ _id: id });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  remove(criteria) {
    return Contact.remove(criteria);
  },

  /**
   * Paginates all Contact models.
   *
   * @param {object} params
   * @param {object.object} params.pagination The pagination parameters.
   * @param {object.object} params.sort The sort parameters.
   * @return {Pagination}
   */
  paginate({ pagination, sort } = {}) {
    return new Pagination(Contact, { pagination, sort });
  },

  /**
   * Searches & Paginates all Contact models.
   *
   * @param {object} params
   * @param {object.object} params.pagination The pagination parameters.
   * @param {object.object} params.search The search parameters.
   * @return {Pagination}
   */
  search({ pagination, search } = {}) {
    const { typeahead } = search;
    const { criteria, sort } = TypeAhead.getCriteria(typeahead);
    return new Pagination(Contact, { criteria, pagination, sort });
  },

  /**
   *
   * @param {number} [count=1]
   * @return {object}
   */
  generate(count = 1) {
    return fixtures(Contact, count);
  },

  async seed({ count = 1 } = {}) {
    const results = this.generate(count);
    await Promise.all(results.all().map(model => model.save()));
    return results;
  },


  /**
   * @param {Model} Model
   * @param {string} id
   * @param {string} type
   * @param {string} contactId
   * @return {Promise}
   */
  async addContactTo(Model, id, type, contactId) {
    if (!['internal', 'external'].includes(type)) throw new Error('Invalid notification type');
    await Contact.findById(contactId);
    const criteria = { _id: id };
    const key = `notify.${type}`;
    const update = { $addToSet: { [key]: contactId } };
    const options = { new: true, runValidators: true };
    return Model.findOneAndUpdate(criteria, update, options).then((document) => {
      if (!document) throw new Error(`Unable to add contact: no record was found for ID '${id}'`);
      return document;
    });
  },

  /**
   * @param {Model} Model
   * @param {string} id
   * @param {string} type
   * @param {string} contactId
   * @return {Promise}
   */
  async removeContactFrom(Model, id, type, contactId) {
    if (!['internal', 'external'].includes(type)) throw new Error('Invalid notification type');
    const criteria = { _id: id };
    const key = `notify.${type}`;
    const update = { $pull: { [key]: contactId } };
    const options = { new: true, runValidators: true };
    return Model.findOneAndUpdate(criteria, update, options).then((document) => {
      if (!document) throw new Error(`Unable to remove contact: no record was found for ID '${id}'`);
      return document;
    });
  },

  /**
   * @param {Model} Model
   * @param {string} id
   * @param {string} type
   * @param {Array} contactId
   * @return {Promise}
   */
  async setContactsFor(Model, id, type, contactIds) {
    if (!['internal', 'external'].includes(type)) throw new Error('Invalid notification type');
    const criteria = { _id: id };
    const key = `notify.${type}`;
    const update = { $set: { [key]: contactIds } };
    const options = { new: true, runValidators: true };
    return Model.findOneAndUpdate(criteria, update, options).then((document) => {
      if (!document) throw new Error(`Unable to update contact: no record was found for ID '${id}'`);
      return document;
    });
  },
};
