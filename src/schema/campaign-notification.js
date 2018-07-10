const { Schema } = require('mongoose');
const connection = require('../connections/mongoose/instance');

const schema = new Schema({
  campaignId: {
    type: Schema.Types.ObjectId,
    required: true,
    validate: {
      async validator(v) {
        const doc = await connection.model('campaign').findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No campaign found for ID {VALUE}',
    },
  },
  type: {
    type: String,
    enum: ['Campaign Created', 'Campaign Started', 'Campaign Ended'],
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Sending', 'Sent', 'Errored'],
    default: 'Pending',
  },
  error: String,
  sendAt: {
    type: Date,
    required: true,
    default: () => new Date(),
  },

  to: [String],
  cc: [String],
  bcc: [String],

  subject: String,
  text: String,
  html: String,
}, { timestamps: true });


module.exports = schema;
