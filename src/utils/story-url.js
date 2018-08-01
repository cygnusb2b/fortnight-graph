const { NODE_ENV } = process.env;

module.exports = (host, storyId) => {
  const protocol = NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}/story/${storyId}`;
};
