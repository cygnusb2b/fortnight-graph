const { Schema } = require('mongoose');

const schema = new Schema({
  /**
   * Placement ID
   */
  pid: {
    required: true,
    type: Schema.Types.ObjectId,
  },

  /**
   * Publisher ID
   */
  pubid: {
    required: true,
    type: Schema.Types.ObjectId,
  },

  /**
   * Campaign ID
   */
  tid: {
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

schema.index({ pubid: 1 });
schema.index({ pid: 1, day: 1 }, { unique: true });

module.exports = schema;
