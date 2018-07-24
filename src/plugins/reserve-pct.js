module.exports = function reservePctPlugin(schema) {
  schema.add({
    reservePct: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  });
};
