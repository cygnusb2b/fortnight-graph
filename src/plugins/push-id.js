const pushId = require('unique-push-id');

module.exports = function pushIdPlugin(schema, { fieldName, required = false } = {}) {
  const name = fieldName || 'pushId';
  schema.add({
    [name]: {
      type: String,
      unique: true,
      required,
      default() {
        return pushId();
      },
      set(v) {
        if (!required && !v) return undefined;
        return v;
      },
      validate: {
        validator(v) {
          if (!required && !v) return true;
          return /^[0-9a-z-_]{20}$/i.test(v);
        },
        message: 'Invalid push ID value for {VALUE}',
      },
    },
  });
};
