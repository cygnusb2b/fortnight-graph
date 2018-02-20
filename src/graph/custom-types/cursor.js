const Base64URL = require('base64-url');
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');

const toCursor = value => Base64URL.encode(`${value}`);

const fromCursor = (value) => {
  const cursor = Base64URL.decode(value);
  if (cursor) return cursor;
  return null;
};

const CursorType = new GraphQLScalarType({
  name: 'Cursor',
  serialize(value) {
    if (value) return toCursor(value);
    return null;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return fromCursor(ast.value);
    }
    return null;
  },
  parseValue(value) {
    if (value) return fromCursor(value);
    return null;
  },
});

module.exports = { toCursor, fromCursor, CursorType };
