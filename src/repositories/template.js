const Promise = require('bluebird');
const handlebars = require('handlebars');
const moment = require('moment');
const Template = require('../models/template');
const Pagination = require('../classes/pagination');
const fixtures = require('../fixtures');

const buildFields = ({ uuid, pid, cid }) => encodeURIComponent(JSON.stringify({ uuid, pid, cid }));

const extractFields = (context) => {
  const { data } = context;
  const { root } = data || {};
  const { pid, uuid, campaign } = root || {};
  const cid = campaign ? campaign.id : undefined;
  return { uuid, pid, cid };
};

const buildAttrs = keyValues => keyValues.map(o => `data-fortnight-${o.key}="${o.value}"`).join(' ');

handlebars.registerHelper('moment-format', (date, format) => moment(date).format(format));
handlebars.registerHelper('get-timestamp', () => (new Date()).getTime());

handlebars.registerHelper('build-container-attributes', (context) => {
  const { uuid, pid, cid } = extractFields(context);
  const keyValues = [
    { key: 'action', value: 'view' },
    { key: 'fields', value: buildFields({ uuid, pid, cid }) },
    { key: 'timestamp', value: (new Date()).getTime() },
  ];

  const attrs = buildAttrs(keyValues);
  return new handlebars.SafeString(attrs);
});

handlebars.registerHelper('tracked-link', function trackedLink(context) {
  const { hash } = context;
  const { uuid, pid, cid } = extractFields(context);
  const keyValues = [
    { key: 'action', value: 'click' },
    { key: 'fields', value: buildFields({ uuid, pid, cid }) },
  ];
  const attrs = [];
  attrs.push(Object.keys(hash).map(name => `${name}="${hash[name]}"`).join(' '));
  attrs.push(buildAttrs(keyValues));

  return new handlebars.SafeString(`<a ${attrs.join(' ')}>${context.fn(this)}</a>`);
});

handlebars.registerHelper('build-beacon', (context) => {
  const { uuid, pid, cid } = extractFields(context);
  const keyValues = [
    { key: 'uuid', value: uuid },
    { key: 'pid', value: pid },
    { key: 'cid', value: cid },
  ];
  const fields = keyValues.filter(o => o.value).map(o => `${o.key}: '${o.value}'`).join(', ');
  return new handlebars.SafeString(`<script>fortnight('event', 'load', { ${fields} }, { transport: 'beacon' });</script>`);
});

handlebars.registerHelper('build-ua-beacon', (context) => {
  const { pid, cid } = extractFields(context);
  return new handlebars.SafeString(`<script>if (window.ga) { ga('send', 'event', 'Fortnight', 'load', '${pid || ''}', '${cid || ''}'); }</script>`);
});

module.exports = {
  /**
   *
   * @param {object} payload
   * @return {Promise}
   */
  create(payload = {}) {
    const template = new Template(payload);
    return template.save();
  },

  update(id, payload = {}) {
    if (!id) return Promise.reject(new Error('Unable to update template: no ID was provided.'));
    const criteria = { _id: id };
    const $set = {};
    ['name', 'html', 'fallback'].forEach((key) => {
      const value = payload[key];
      if (typeof value !== 'undefined') $set[key] = value;
    });
    const options = { new: true, runValidators: true };
    return Template.findOneAndUpdate(criteria, { $set }, options).then((document) => {
      if (!document) throw new Error(`Unable to update template: no record was found for ID '${id}'`);
      return document;
    });
  },

  /**
   * Find a Template record by ID.
   *
   * Will return a rejected promise if no ID was provided.
   * Will NOT reject the promise if the record cannnot be found.
   *
   * @param {string} id
   * @return {Promise}
   */
  findById(id) {
    if (!id) return Promise.reject(new Error('Unable to find template: no ID was provided.'));
    return Template.findOne({ _id: id });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  find(criteria) {
    return Template.find(criteria);
  },

  /**
   * @param {string} id
   * @return {Promise}
   */
  removeById(id) {
    if (!id) return Promise.reject(new Error('Unable to remove template: no ID was provided.'));
    return this.remove({ _id: id });
  },

  /**
   * @param {object} criteria
   * @return {Promise}
   */
  remove(criteria) {
    return Template.remove(criteria);
  },

  /**
   * Paginates all Template models.
   *
   * @param {object} params
   * @param {object.object} params.pagination The pagination parameters.
   * @param {object.object} params.sort The sort parameters.
   * @return {Pagination}
   */
  paginate({ pagination, sort } = {}) {
    return new Pagination(Template, { pagination, sort });
  },

  /**
   *
   * @param {number} [count=1]
   * @return {object}
   */
  generate(count = 1) {
    return fixtures(Template, count);
  },

  async seed({ count = 1 } = {}) {
    const results = this.generate(count);
    await Promise.all(results.all().map(model => model.save()));
    return results;
  },

  render(source, data) {
    const template = handlebars.compile(source);
    return template(data);
  },

  /**
   * Returns a handlebars template to use when no fallback is provided.
   *
   * @param {boolean} withUa Whether or not to include the UA beacon.
   * @return string
   */
  getFallbackFallback(withUA = false) {
    const ua = withUA ? '{{build-ua-beacon}}' : '';
    return `<div style="width:1px;height:1px;" {{build-container-attributes}}>{{build-beacon}}${ua}</div>`;
  },
};
