const Base64URL = require('base64-url');
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');

const toCursor = value => Base64URL.encode(`${value}`);

const fromCursor = (value) => {
  if (!value) return null;
  const cursor = Base64URL.decode(value);
  if (cursor) {
    return cursor;
  }
  return null;
};

const CursorType = new GraphQLScalarType({
  name: 'Cursor',
  serialize(value) {
    if (value) {
      return toCursor(value);
    }
    return null;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return fromCursor(ast.value);
    }
    return null;
  },
  parseValue(value) {
    return fromCursor(value);
  },
});

module.exports = { toCursor, fromCursor, CursorType };
