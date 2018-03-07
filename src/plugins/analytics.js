const moment = require('moment');

module.exports = function analyticsPlugin(schema) {
  schema.add({
    hash: {
      type: String,
      required: true,
      validate: {
        validator(v) {
          return /[a-f0-9]{32}/.test(v);
        },
        message: 'Invalid hash value for {VALUE}',
      },
    },
    hour: {
      type: Date,
      required: true,
      set: (v) => {
        if (!(v instanceof Date)) return undefined;
        const date = moment(v);
        date.utc().startOf('hour');
        return date.toDate();
      },
    },
    last: {
      type: Date,
      required: true,
      set(v) {
        if (!(v instanceof Date)) return undefined;
        this.hour = v;
        return v;
      },
    },
    n: {
      type: Number,
      default: 0,
    },
  });
};
