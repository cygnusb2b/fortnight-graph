const mongoose = require('mongoose');
const shortid = require('shortid');

const { Schema } = mongoose;

const schema = new Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
    default: shortid.generate,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  userIds: {
    type: [Schema.Types.ObjectId],
  },
  photoURL: {
    type: String,
  }
});

schema.pre('save', function setPhotoURL(next) {
  if (!this.photoURL) {
    this.photoURL = `https://robohash.org/${this.id}?set=set3&bgset=bg2`;
    next();
  }
})

module.exports = schema;
