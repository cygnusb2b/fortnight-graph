const mongoose = require('mongoose');
const uuidv4 = require('uuid/v4');
const uuidParse = require('uuid-parse');

const { Schema } = mongoose;
const MongooseBuffer = mongoose.Types.Buffer;

const createBuffer = buffer => new MongooseBuffer(buffer).toObject(0x04);

module.exports = new Schema({
  _id: {
    type: Schema.Types.Buffer,
    default: () => {
      const buffer = uuidv4(null, Buffer.alloc(16));
      return createBuffer(buffer);
    },
    get: buffer => uuidParse.unparse(buffer),
    set: (string) => {
      const buffer = uuidParse.parse(string);
      return createBuffer(buffer);
    },
  },
  d: {
    type: Date,
    required: true,
    default: () => new Date(),
  },
  cid: {
    type: Schema.Types.ObjectId,
  },
  pid: {
    type: Schema.Types.ObjectId,
    required: true,
  },
});
