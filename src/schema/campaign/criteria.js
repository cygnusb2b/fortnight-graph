const mongoose = require('mongoose');
const Placement = require('../../models/placement');

const { Schema } = mongoose;

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
        const doc = await Placement.findOne({ _id: v }, { _id: 1 });
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
