const randomBetween = require('../utils/random-between');

module.exports = () => ({
  models: [],
  get length() {
    return this.models.length;
  },
  random() {
    if (!this.length) return null;
    const last = this.length - 1;
    if (last === 0) return this.models[0];
    const index = randomBetween(0, last);
    return this.models[index];
  },
  all() {
    return this.models;
  },
  add(model) {
    this.models.push(model);
    return this;
  },
  one() {
    if (!this.length) return null;
    return this.models.slice(0).shift();
  },
});
