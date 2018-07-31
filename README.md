# Fortnight (GraphQL) API
Server backend for the Fortnight project, including the primary Graph API, as well as placement and tracking endpoints.

## Requirements
This project requires [Docker Compose](https://docs.docker.com/compose/overview/) to develop and test. The [Yarn](https://yarnpkg.com) package manager is also required, and is used instead of `npm`.

## Runnning
1. Clone repository
2. Override any applicable development environment variables (see [Environment Variables](#environment-variables) below)
3. In the project root, run `yarn run start`
4. The server is now accessible on `localhost:8100` (or whatever port you configure)

## Interactive Terminal
You can load an interactive terminal for the app container via `yarn run terminal`. This will allow you to add, remove, or upgrade project dependencies using Yarn (among other things). Note: _the application instance must be running via `yarn run start` for the terminal to load._

## Environment Variables
Production environment variables are *not* under version control, per [Part 3 of the 12 Factors](https://12factor.net/config). As such, the [dotenv](https://www.npmjs.com/package/dotenv) package is used to manage your variables locally.
1. Create a `.env` file in the project root (at the same level as the `package.json` file)
2. Set (or change) values for the following variables:
```ini
GRAPH_APP_PORT=8100
GRAPH_DB_PORT=8101
GRAPH_ES_NODE_PORT=8102
GRAPH_ES_TRANSPORT_PORT=8103
GRAPH_ES_KIBANA_PORT=8104

DEBUG=express:*
MONGOOSE_DEBUG=1
TRACKER_SECRET=somevaluethatshouldbedifferentinprod
```

### Production Environment Variables
The following environment variables must be set at run-time for the production deployment of this application. The development and test environments set appropriate values for those environments within the `docker-compose.yml` configuration files.
```
# Must be configured per account instance
ACCOUNT_KEY=

# Can be configured globally
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
BASE_URI=
ELASTIC_HOST=
IMGIX_URL=
MONGOOSE_DEBUG=
MONGO_DSN=
NEW_RELIC_LICENSE_KEY=
NODE_ENV=production
PORT=8100
REDIS_DSN=
SENDGRID_API_KEY=
SENDGRID_FROM=

## API
### Graph
The API utilizes [GraphQL](http://graphql.org/learn/) and, as such, there is one endpoint for accessing the API: `/graph`. The GraphQL implementation is setup to handle JSON `POST` requests (or `GET` requests with the `?query=` parameter) for both queries and mutations.
#### Queries and Mutatations
```graphql
type Query {
  ping: String!
  currentUser: User
  checkSession(input: SessionTokenInput!): Authentication
  signImageUpload(input: ImageUploadInput!): SignedImageLocation!
  advertiser(input: ModelIdInput!): Advertiser!
  allAdvertisers(pagination: PaginationInput): [Advertiser]
}

type Mutation {
  createUser(input: CreateUserInput!): User
  createAdvertiser(input: CreateAdvertiserInput!): Advertiser
  loginUser(input: LoginInput!): Authentication
  deleteSession: String
}
```
See the `graph/index.graphql` file for complete details, or use a GraphQL compatible client (such as [Insomnia](https://insomnia.rest/)) for automatic schema detection and query autocomplete capabilities.

### Placement Delivery
Requests for an ad placement, or placements, can be made to `GET /placement/{pid}.html?opts={}` (or `.json` for JSON responses). This will trigger the Campaign-Serve-Algorithm (or CSA) and provide the best matching campaigns for the requested Placement ID (`pid`) and request options. If no campaigns can be found for the specific request, an empty response will be returned.

Request options must sent as a URL encoded, compact JSON string, assigned to the value of the `opts` query string. All fields are optional.

```js
encodeURIComponent(JSON.stringify({
  /**
   * Optional.
   * Specifies the number of campaigns that should be returned.
   * The default value is `1` and cannot exceed `10` (a 400 response will be returned if the max is exceeded).
   * The CSA will do its best to return the number requested, but is not guaranteed, based on inventory conditions.
   */
  n: 1,

  /**
   * Optional.
   * The custom targting variables to send with the request - used for campaign targeting.
   * Only custom variables that have been pre-defined in the system will be used.
   * Any others will be ignored.
   */
  cv: {
    foo: 'bar',
    key: 'value',
  },

  /**
   * Optional.
   * The custom merge values to be used within the template when a campaign is found and rendered.
   * Will only be applied if the variable exists within the template.
   */
  mv: {
    foo: 'bar',
    key: 'value',
  },

  /**
   * Optional.
   * The fallback variables to use to fill the template's fallback HTML (if defined on the template).
   * Will be used when no campaign(s) are found.
   * If this is left empty, or no fallback HTML is defined on the template, no fallback will be returned.
   */
  fv: {
    foo: 'bar',
    key: 'value',
  },
}));
```

The above example is for illustrative purposes. An actual request would be similar to:
`GET /placement/{pid}.html?opts={"n":1,"cv":{"foo":"bar","key":"value"},"mv":{"foo":"bar","key":"value"},"fv":{"foo":"bar","key":"value"}}`
When URL encoded: `opts=%7B%22n%22%3A1%2C%22cv%22%3A%7B%22foo%22%3A%22bar%22%2C%22key%22%3A%22value%22%7D%2C%22mv%22%3A%7B%22foo%22%3A%22bar%22%2C%22key%22%3A%22value%22%7D%2C%22fv%22%3A%7B%22foo%22%3A%22bar%22%2C%22key%22%3A%22value%22%7D%7D`

### Campaign Status

#### Flags
**Deleted (`deleted: true|false`)**
Defaults to false.
Determines if the campaign has been outright deleted from the system.
Campaigns can be deleted via the interface.

**Ready (`ready: true|false`)**
Defaults to false.
Determines if the campaign is ready to be delivered.
Is controlled (and saved) by the backend. Is _not_ toggleable in the interface.
Is true when:
- `criteria.start` has a date value
- `criteria.placements.length` is greater than one
- At least one creative from `creatives` array has `active` set to `true`
- For URL campaigns: the `url` value is set
- For Story campaigns: the related `storyId` is published

**Paused (`paused: true|false`)**
Defaults to false.
Is directly toggleable in the interface.

#### Status
This field is not saved directly on the model and, instead, is calculated using flags.
In priority order (acts like a `switch` block):
- Deleted
  - When `deleted: true`
- Finished
  - When `criteria.end` exists and is less than or equal to now
- Incomplete
  - When `ready: false`
- Paused
  - When `paused: true`
- Running
  - And `criteria.start` is less than or equal to now
- Scheduled
  - When all of the above criteria is not met


#### Serving
In order for a campaign to serve, it must meet the following conditions globally (in addition to targeting-specific criteria):
1. `deleted: false`
2. `ready: true`
3. `paused: false`
4. `criteria.start: { $lte: [now] }`
5. `$or: [ { criteria.end: { $gt: [now] } }, { crteria.end: { $exists: false } }, { criteria.end: null } ]`

### Deletion Rules
The following models _cannot_ be soft-deleted when... (note: by "active" we mean "non-deleted" [`deleted: false`])

**Advertiser**
- An active Story exists with `Story.advertiserId` equal to `Advertiser.id`
- An active Campaign exists with `Campaign.advertiserId` equal to `Advertiser.id`

**Story**
- An active Campaign exists with `Campaign.storyId` equal to `Story.id`

**Campaign**
- No restrictions.

**Publisher**
- An active Placement exists with `Placement.publisherId` equal to `Publisher.id`
- An active Topic exists with `Topic.publisherId` equal to `Publisher.id`

**Placement**
- An active Campaign exists with `Campaign.criteria.placementIds` containing `Placement.id`

**Template**
- An active Placement exists with `Placement.templateId` equal to `Template.id`

**Topic**
- An active Placement exists with `Placement.topicId` equal to `Topic.id`

**Contact**
- No restrictions. _Note:_ When a contact is deleted, it is also removed from the `notify.internal` and `notify.external` fields of `Advertiser` and `Campaign`.

**User**
- No restrictions. _Note:_ Unlike other models, soft-deleted users will continue to display throughout the interface. This is to ensure that user attribution information is retained.

**Image**
- Not soft-deleteable.


## Development
### Docker Compose
The development and testing environments are now set up using Docker Compose. Changes to environments (such as database version or new environment variables) should be made within the relevant `docker-compose.yml` file.

#### Development
To start up the development environment, execute `yarn run start` from the project root. This will initialize the docker environment for this project and boot up your application and any dependant containers (such as mongo or redis.) The first execution will take some time to download and configure docker images. To stop your environment, press `CTRL+C` in your terminal. If your environment does not shut down cleanly, you can execute `yarn run stop` to clean up and shutdown the environment.

You can optionally execute `yarn run start &` to cause your terminal to return to the prompt immediately (logs will continue to display) to allow you to execute additional commands. To stop your environment, execute `yarn run stop`.

To re-initialize your entire environment, execute `yarn run stop` to shutdown. Then run `docker volume rm fortnightgraph_node_modules` to remove the cached dependancies. If you want to remove MongoDB data, run `docker volume rm fortnightgraph_mongodb`. Finally, execute `docker-compose -p fortnightgraph rebuild` to force rebuilding the application from the project `Dockerfile` (Typically only needed when making changes to the `docker-compose.yml` configuration.) Executing `yarn run start` again will re-initialize and start up the environment from scratch.

#### Testing
The testing framework runs within a second Docker Compose environment defined in `test/docker-compose.yml`. Primarily the only difference between dev and test is that the containers shut down after execution rather than watch for changes, and the databases are not retained between test runs -- necessitating that fixtures run to create test data.

The test environment can be booted and run by executing `yarn run test` or `yarn run coverage`, or manually via `docker-compose -p fortnightgraphtest -f test/docker-compose.yml run --entrypoint "yarn run test" test`.

### Running/Writing Tests
[Mocha](https://mochajs.org/) and [Chai](http://chaijs.com/) are used for unit testing. All tests are found in the `/test` folder, and must contain `.spec.js` in the name in order for the file to be recognized. You can run tests via the `yarn run test` command. Preferably, the folder and file structure should mimic the `/src` directory. For example, the  file `/src/classes/auth.js` should have a corresponding test file located at `/test/classes/auth.spec.js`. While the BDD assertion style is preferred (e.g. `expect` or `should`), feel free to use the TDD `assert` style if that's more comfortable. **Note:** the test command will also execute the `lint` command. In other words, if lint errors are found, the tests will also fail!

By default, running `yarn run test` will run all test files. You can optionally specify the tests to run by executing `yarn run test tests/some/test.spec.js`, or using a glob: `yarn run test "tests/some-folder/*.js"` (_make sure you include the quotes_). This is usually more efficient when writing new tests, so you don't have to wait for the entire test suite to finish when making tweaks.

Since the test environment runs within a Docker container, tests (generally) are a mixture of unit and integration tests. If your test will access either Mongo and/or Redis, you **must** include the connection bootstrapper (`require('../connections);`) as the _first_ line in your test file. This ensures that the connections are properly intialized, torn down, and that Mocha will exit correctly (not hang).

All tests are bootstrapped using the `/test/bootstrap.js` file. This globally exposes the `Promise` (via `bluebird`), `chai`, `request` (via `supertest`), `sinon`, and `expect` (via `chai`) variables, so you do not need to require these packages your tests. In addition, `chai-as-promised` is loaded within the bootstrapped Chai instance.

#### Successful Test Criteria
You __must__ ensure that new tests will run successfully as _an individual file_ and as a part of the _global test suite_. The test(s) should pass and the container should properly exit and tear down. For example, if you've just created the`/test/my-cool-test.spec.js` test file, then __both__ of these commands should meet the success conditions: `yarn run test` and `yarn run test test/my-cool-test.spec.js`.

### Code Coverage
Test coverage is handled by [Instanbul/nyc](https://istanbul.js.org/). To view a coverage report, execute `yarn run coverage` at the root of the project. When adding/modifying code, the coverage should preferably stay the same (meaning new tests were added) - or get better!

## Additional Resources
This application uses many popular, open source NodeJS packages. Please visit the following links if you'd like to learn more.
- [Express](https://expressjs.com/) - "Fast, unopinionated, minimalist web framework for Node.js"
- [Apollo Graph Server](https://www.apollographql.com/servers) - "Easily build a GraphQL API that connects to one or more
REST APIs, microservices, or databases."
- [Mongoose](http://mongoosejs.com/docs/guide.html) - "elegant mongodb object modeling for node.js"
- [Passport](http://www.passportjs.org/) - "Simple, unobtrusive authentication for Node.js"
- [Bluebird](http://bluebirdjs.com/docs/getting-started.html) - "A full featured promise library with unmatched performance."

