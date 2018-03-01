const mongoose = require('mongoose');

module.exports = {
  autocomplete(type, field, term) {
    const model = mongoose.model(type);
    return model.find({ [field]: new RegExp(`^${term}`, 'i') });
  },
};
