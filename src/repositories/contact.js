const Promise = require('bluebird');
const Contact = require('../models/contact');
const Pagination = require('../classes/pagination');
const fixtures = require('../fixtures');
const { buildEntityNameQuery, paginateSearch, buildEntityAutocomplete } = require('../elastic/utils');

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
   * Will throw if no ID was provided.
   * Will NOT reject the promise if the record cannnot be found.
   *
   * @param {string} id
   * @return {Promise}
   */
  async findById(id) {
    if (!id) throw new Error('Unable to find contact: no ID was provided.');
    return Contact.findOne({ _id: id });
  },

  /**
   * Find a Contact record by email.
   *
   * Will throw if no email was provided.
   * Will NOT reject the promise if the record cannnot be found.
   *
   * @param {string} email
   * @return {Promise}
   */
  async findByEmail(email) {
    if (!email) throw new Error('Unable to find contact: no email was provided.');
    return Contact.findOne({ email });
  },

  /**
   * Returns a contact, or creates one.
   */
  async getOrCreateFor({ email, givenName, familyName }) {
    try {
      const existing = await this.findByEmail(email);
      return existing;
    } catch (e) {
      return this.create({ givenName, familyName, email });
    }
  }

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
   * @param {string} phrase The search phrase.
   * @param {object} params The search parameters.
   * @param {object.object} params.pagination The pagination parameters.
   * @return {SearchPagination}
   */
  search(phrase, { pagination } = {}) {
    const query = buildEntityNameQuery(phrase);
    const { should } = query.bool;
    should.push({ match: { email: { query: phrase, boost: 5 } } });
    should.push({ match: { 'email.edge': { query: phrase, operator: 'and', boost: 2 } } });
    should.push({ match: { 'email.edge': { query: phrase, boost: 1 } } });
    return paginateSearch(Contact, phrase, query, { pagination });
  },

  autocomplete(phrase, { pagination } = {}) {
    const query = buildEntityAutocomplete(phrase);
    const { should } = query.bool;
    should.push({ match: { 'email.edge': { query: phrase, operator: 'and', boost: 2 } } });
    should.push({ match: { 'email.edge': { query: phrase, boost: 1 } } });
    return paginateSearch(Contact, phrase, query, { pagination });
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
