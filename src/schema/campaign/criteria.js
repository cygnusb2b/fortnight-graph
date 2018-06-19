const { Schema } = require('mongoose');
const connection = require('../../connections/mongoose/instance');

module.exports = new Schema({
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
  },
  placementIds: [{
    type: Schema.Types.ObjectId,
    required: true,
    validate: {
      async validator(v) {
        const doc = await connection.model('placement').findOne({ _id: v }, { _id: 1 });
        if (doc) return true;
        return false;
      },
      message: 'No placement found for ID {VALUE}',
    },
  }],

  kvs: [{
    key: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
  }],
});
