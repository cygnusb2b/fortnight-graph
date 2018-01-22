const { join } = require('path');
const { makeExecutableSchema } = require('graphql-tools');
const { importSchema } = require('graphql-import');
const resolvers = require('./resolvers');

const typeDefs = importSchema(join(__dirname, 'index.graphql'));

module.exports = makeExecutableSchema({
  typeDefs,
  resolvers,
});
