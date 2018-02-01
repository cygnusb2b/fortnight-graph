const regex = new RegExp('^[a-f0-9]{32}$');

const normalize = value => (value ? String(value).trim().replace(/-/g, '').toLowerCase() : null);

const is = (value) => {
  const normalized = normalize(value);
  if (!normalized) return false;
  return regex.test(normalized);
};

module.exports = {
  normalize,
  is,
};

