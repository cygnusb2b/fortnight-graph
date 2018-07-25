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
  status: {
    type: String,
    default: 'Ready',
    enum: ['Draft', 'Ready'],
  },
});

imagePlugin(schema, { fieldName: 'imageId' });

module.exports = schema;
