module.exports = function reservePctPlugin(schema) {
  schema.add({
    reservePct: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
  });
};
