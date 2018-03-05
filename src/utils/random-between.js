const { floor, random } = Math;

module.exports = (min, max) => {
  if (min === max) return min;
  return floor(random() * (max - (min + 1))) + min;
};
