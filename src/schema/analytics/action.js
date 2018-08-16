const { Schema } = require('mongoose');

const schema = new Schema({
  /**
   * The event action
   */
  act: {
    type: String,
    required: true,
    enum: [
      'view',
      'click',
    ],
  },
  /**
   * Placement ID
   */
  pid: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  /**
   * Campaign ID
   */
  cid: {
    type: Schema.Types.ObjectId,
  },
  /**
   * Creative ID
   */
  cre: {
    type: Schema.Types.ObjectId,
  },
  /**
   * The date of the event
   */
  d: {
    type: Date,
    required: true,
  },
});

schema.index({ d: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
schema.index({ e: 1 });
schema.index({ cid: 1 });
schema.index({ pid: 1 });

module.exports = schema;
