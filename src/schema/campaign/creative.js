const { Schema } = require('mongoose');
const imagePlugin = require('../../plugins/image');

const schema = new Schema({
  title: {
    type: String,
    trim: true,
  },
  teaser: {
    type: String,
    trim: true,
  },
  active: {
    type: Boolean,
    required: true,
    default: true,
  },
});

imagePlugin(schema, { fieldName: 'imageId' });

module.exports = schema;
