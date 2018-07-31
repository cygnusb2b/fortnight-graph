const { Schema } = require('mongoose');
const handlebars = require('../handlebars');
const connection = require('../connections/mongoose/instance');
const { applyElasticPlugin, setEntityFields } = require('../elastic/mongoose');
const {
  deleteablePlugin,
  paginablePlugin,
  repositoryPlugin,
  searchablePlugin,
} = require('../plugins');

const validateBeacon = (v) => {
  const results = v.match(/{{build-beacon}}/g);
  if (!results) return false;
  if (results.length > 1) return false;
  return true;
};

const validateUABeacon = (v) => {
  const results = v.match(/{{build-ua-beacon}}/g);
  if (!results) return true; // Optional
  // But if present, only allow one time.
  if (results.length > 1) return false;
  return true;
};

const validateContainerAttrs = (v) => {
  const results = v.match(/{{build-container-attributes}}/g);
  if (!results) return false;
  if (results.length > 1) return false;
  return true;
};

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  html: {
    type: String,
    required: true,
    validate: [
      {
        validator(v) {
          return validateContainerAttrs(v);
        },
        message: 'The {{build-container-attributes}} helper must be present, exactly one time.',
      },
      {
        validator(v) {
          return validateBeacon(v);
        },
        message: 'The {{build-beacon}} helper must be present, exactly one time.',
      },
      {
        validator(v) {
          return validateUABeacon(v);
        },
        message: 'The {{build-ua-beacon}} helper is optional, but can only be used once.',
      },
      {
        validator(v) {
          return /{{#tracked-link href=href/g.test(v);
        },
        message: 'The {{#tracked-link href=href}}{{/tracked-link}} helper must be present.',
      },
    ],
  },
  fallback: {
    type: String,
    validate: [
      {
        validator(v) {
          if (!v) return true;
          return validateContainerAttrs(v);
        },
        message: 'The {{build-container-attributes}} helper must be present, exactly one time.',
      },
      {
        validator(v) {
          if (!v) return true;
          return validateBeacon(v);
        },
        message: 'The {{build-beacon}} helper must be present, exactly one time.',
      },
      {
        validator(v) {
          if (!v) return true;
          return validateUABeacon(v);
        },
        message: 'The {{build-ua-beacon}} helper is optional, but can only be used once.',
      },
      {
        validator(v) {
          if (!v) return true;
          return /{{#tracked-link href=url/g.test(v);
        },
        message: 'The {{#tracked-link href=url}}{{/tracked-link}} helper must be present.',
      },
    ],
  },
}, { timestamps: true });

setEntityFields(schema, 'name');
applyElasticPlugin(schema, 'templates');

schema.plugin(deleteablePlugin, {
  es_indexed: true,
  es_type: 'boolean',
});
schema.plugin(repositoryPlugin);
schema.plugin(paginablePlugin);
schema.plugin(searchablePlugin, { fieldNames: ['name'] });

schema.pre('save', async function updatePlacements() {
  if (this.isModified('name')) {
    // This isn't as efficient as calling `updateMany`, but the ElasticSearch
    // plugin will not fire properly otherwise.
    // As such, do not await the update.
    const Placement = connection.model('placement');
    const docs = await Placement.find({ templateId: this.id });
    docs.forEach((doc) => {
      doc.set('templateName', this.name);
      doc.save();
    });
  }
});

schema.pre('save', async function checkDelete() {
  if (!this.isModified('deleted') || !this.deleted) return;

  const placements = await connection.model('placement').countActive({ templateId: this.id });
  if (placements) throw new Error('You cannot delete a template with related placements.');
});

/**
 * Renders/compiles a template from the provided source with the
 * provided data hash.
 *
 * @param {string} source
 * @param {object} data
 */
schema.statics.render = function render(source, data) {
  const template = handlebars.compile(source);
  return template(data);
};

/**
 * Returns a handlebars template to use when no fallback is provided.
 *
 * @param {boolean} withUa Whether or not to include the UA beacon.
 */
schema.statics.getFallbackFallback = function getFallbackFallback(withUA = false) {
  const ua = withUA ? '{{build-ua-beacon}}' : '';
  return `<div style="width:1px;height:1px;" {{build-container-attributes}}>{{build-beacon}}${ua}</div>`;
};

schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

module.exports = schema;
