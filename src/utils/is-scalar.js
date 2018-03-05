module.exports = (value) => {
  const type = typeof value;
  const types = ['string', 'number', 'boolean', 'symbol', 'undefined'];
  if (types.includes(type)) return true;

  if (value === null) return true;
  if (value instanceof String) return true;
  if (value instanceof Number) return true;
  if (value instanceof Boolean) return true;
  return false;
};
