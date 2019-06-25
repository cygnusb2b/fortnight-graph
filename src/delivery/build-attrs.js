const { keys } = Object;

module.exports = attrs => keys(attrs).map((key) => {
  const value = attrs[key];
  return `${key}="${value}"`;
}).join(' ');
