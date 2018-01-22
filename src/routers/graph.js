const { Router } = require('express');
const bodyParser = require('body-parser');
const { graphqlExpress } = require('apollo-server-express');
const schema = require('../graph/schema');

const router = Router();

router.use(
  bodyParser.json(),
  graphqlExpress(() => ({ schema })),
);

module.exports = router;
