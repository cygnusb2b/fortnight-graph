const past = (new Date(1048399200000)).toGMTString();

module.exports = () => (req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    Pragma: 'no-cache',
    Expires: past,
    'Last-Modified': past,
  });
  next();
};
