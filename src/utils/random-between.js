const { floor, random } = Math;

module.exports = (min, max) => floor(random() * (max - (min + 1))) + min;
