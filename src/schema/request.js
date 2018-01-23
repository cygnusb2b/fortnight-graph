const mongoose = require('mongoose');
const uuidv4 = require('uuid/v4');
const uuidParse = require('uuid-parse');

const { Schema } = mongoose;
const MongooseBuffer = mongoose.Types.Buffer;

module.exports = new Schema({
  _id: {
    type: Schema.Types.Buffer,
    default: () => {
      const buffer = uuidv4(null, Buffer.alloc(16));
      return new MongooseBuffer(buffer).toObject(0x04);
    },
    get: buffer => uuidParse.unparse(buffer),
    set: (string) => {
      const buffer = uuidParse.parse(string);
      return new MongooseBuffer(buffer).toObject(0x04);
    },
  },
  d: {
    type: Date,
    required: true,
    default: () => new Date(),
  },
  cid: {
    type: String,
  },
  pid: {
    type: String,
    required: true,
  },
});
