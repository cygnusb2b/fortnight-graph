const isScalar = require('./is-scalar');

const { keys } = Object;

module.exports = (kv) => {
  const toClean = kv && typeof kv === 'object' ? kv : {};
  const cleaned = {};
  keys(toClean).forEach((key) => {
    const v = toClean[key];
    const empty = v === null || v === undefined || v === '';
    if (!empty && isScalar(v)) {
      // Coerce to string and trim.
      const coerced = String(v).trim();
      if (coerced) cleaned[key] = coerced;
    }
  });
  return cleaned;
};
