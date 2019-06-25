module.exports = (data = {}) => {
  const {
    pid,
    uuid,
    kv,
    campaign,
    creative,
  } = data;
  const cid = campaign ? campaign.id : undefined;
  const cre = creative ? creative.id : undefined;
  return {
    uuid,
    pid,
    cid,
    cre,
    kv,
  };
};
