const { Schema } = require('mongoose');

const schema = new Schema({
  /**
   * Campaign ID
   */
  cid: {
    required: true,
    type: Schema.Types.ObjectId,
  },

  /**
   * Creative ID
   */
  cre: {
    required: true,
    type: Schema.Types.ObjectId,
  },

  /**
   * Campaign ID
   */
  advid: {
    required: true,
    type: Schema.Types.ObjectId,
  },

  day: {
    required: true,
    type: Schema.Types.Date,
  },

  views: {
    type: Number,
    default: 0,
  },

  clicks: {
    type: Number,
    default: 0,
  },
});

schema.index({ advid: 1 });
schema.index({ cid: 1, cre: 1, day: 1 }, { unique: true });

module.exports = schema;
