const { Schema } = require('mongoose');

const botSchema = new Schema({
  reason: String,
  weight: Number,
  pattern: String,
  value: String,
  url: String,
}, { _id: false });

const schema = new Schema({
  /**
   * The user agent of the bot.
   */
  ua: {
    type: String,
    required: true,
    unique: true,
  },
  /**
   * The bot data.
   */
  bot: {
    type: botSchema,
    required: true,
    default: {},
  },
  /**
   * The date the bot was first seen.
   */
  first: {
    type: Date,
    required: true,
  },
  /**
   * The date the bot was last seen.
   */
  last: {
    type: Date,
    required: true,
  },
  /**
   * The number of occurences.
   */
  n: {
    type: Number,
    default: 0,
  },
});

schema.method('preAggregate', async function preAggregate() {
  await this.validate();
  const now = new Date();
  const criteria = { ua: this.ua };

  const $setOnInsert = {
    ...criteria,
    first: now,
  };
  const $set = {
    bot: this.bot,
    last: now,
  };
  const $inc = { n: 1 };
  const update = { $setOnInsert, $set, $inc };
  await this.model('analytics-bot').updateOne(criteria, update, { upsert: true });
});

// Remove bot data once last seen is older than 180 days.
schema.index({ last: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 * 6 });

module.exports = schema;
