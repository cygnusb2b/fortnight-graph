const { GraphQLScalarType } = require('graphql');
// const { Kind } = require('graphql/language');

module.exports = new GraphQLScalarType({
  name: 'Mixed',
  description: 'Mixed/raw scalar type',
  parseValue(value) {
    if (!value) return null;
    return value;
  },
  serialize(value) {
    return value;
  },
  parseLiteral(ast) {
    return ast.value;
    // if (ast.kind === Kind.INT) {
    //   return parseInt(ast.value, 10);
    // }
    // return null;
  },
});
