const dayjs = require('dayjs');
const advancedFormat = require('dayjs/plugin/advancedFormat');
const timezone = require('dayjs/plugin/timezone');
const utc = require('dayjs/plugin/utc');

dayjs
  .extend(utc)
  .extend(timezone)
  .extend(advancedFormat);

module.exports = dayjs;
