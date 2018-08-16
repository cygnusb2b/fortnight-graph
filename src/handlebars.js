const handlebars = require('handlebars');
const moment = require('moment');

handlebars.registerHelper('moment-format', (date, format) => moment(date).format(format));
handlebars.registerHelper('get-timestamp', () => (new Date()).getTime());

const buildFields = fields => encodeURIComponent(JSON.stringify(fields));
const buildAttrs = keyValues => keyValues.map(o => `data-fortnight-${o.key}="${o.value}"`).join(' ');

const extractFields = (context) => {
  const { data } = context;
  const { root } = data || {};
  const {
    pid,
    uuid,
    kv,
    campaign,
    creative,
  } = root || {};
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

handlebars.registerHelper('build-container-attributes', (context) => {
  const fields = extractFields(context);
  const keyValues = [
    { key: 'action', value: 'view' },
    { key: 'fields', value: buildFields(fields) },
    { key: 'timestamp', value: (new Date()).getTime() },
  ];

  const attrs = buildAttrs(keyValues);
  return new handlebars.SafeString(attrs);
});

handlebars.registerHelper('tracked-link', function trackedLink(context) {
  const { hash } = context;
  const fields = extractFields(context);
  const keyValues = [
    { key: 'action', value: 'click' },
    { key: 'fields', value: buildFields(fields) },
  ];
  const attrs = [];
  attrs.push(Object.keys(hash).map(name => `${name}="${hash[name]}"`).join(' '));
  attrs.push(buildAttrs(keyValues));

  return new handlebars.SafeString(`<a ${attrs.join(' ')}>${context.fn(this)}</a>`);
});

handlebars.registerHelper('build-beacon', (context) => {
  const fields = extractFields(context);
  return new handlebars.SafeString(`<script>fortnight('event', 'load', ${JSON.stringify(fields)}, { transport: 'beacon' });</script>`);
});

handlebars.registerHelper('link-to', (...parts) => parts.filter(el => typeof el === 'string').join('/'));

module.exports = handlebars;
