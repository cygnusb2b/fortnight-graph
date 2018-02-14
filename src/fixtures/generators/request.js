module.exports = ({ cid, pid }) => {
  const now = new Date();
  return {
    d: now,
    cid: cid(),
    pid: pid(),
  };
};
