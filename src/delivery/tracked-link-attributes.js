const buildAttrs = require('./build-attrs');
const buildFields = require('./build-fields');
const extractFields = require('./extract-fields');

module.exports = (data, flatten = false) => {
  const fields = extractFields(data);
  const attrs = {
    'data-fortnight-action': 'click',
    'data-fortnight-fields': buildFields(fields),
  };
  if (data.campaign) attrs.rel = 'nofollow';
  if (!flatten) return attrs;
  return buildAttrs(attrs);
};
