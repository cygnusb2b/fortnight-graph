# Fortnight (GraphQL) API
Server backend for the Fortnight project, including the primary Graph API, as well as placement and tracking endpoints.

## Requirements
This project requires [Docker Compose](https://docs.docker.com/compose/overview/) to develop and test. The [Yarn](https://yarnpkg.com) package manager is also required, and is used instead of `npm`.

## Runnning
1. Clone repository
2. Override any applicable development environment variables (see [Environment Variables](#environment-variables) below)
3. In the project root, run `yarn run start`
4. The server is now accessible on `localhost:8100` (or whatever port you configure)

## Environment Variables
Production environment variables are *not* under version control, per [Part 3 of the 12 Factors](https://12factor.net/config). As such, the [dotenv](https://www.npmjs.com/package/dotenv) package is used to manage your variables locally.
1. Create a `.env` file in the project root (at the same level as the `package.json` file)
2. Set (or change) values for the following variables:
```ini
GRAPH_APP_PORT=8100
GRAPH_DB_PORT=8101

DEBUG=express:*
MONGOOSE_DEBUG=1
```

### Production Environment Variables
The following environment variables must be set at run-time for the production deployment of this application. The development and test environments set appropriate values for those environments within the `docker-compose.yml` configuration files.
```
NODE_ENV=production
PORT=8100

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
MONGO_DSN=
REDIS_DSN=
MONGOOSE_DEBUG=
```

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
Requests for an ad placement, or placements, can be made to `GET /placement/{pid}.html` (or `.json` for JSON responses). This will trigger the Campaign-Serve-Algorithm (or CSA) and provide the best matching campaigns for the requested Placement ID (`pid`) and request options. If no campaigns can be found for the specific request, an empty response will be returned.

The available request parameters (as query string values) are as follows, and are _all optional_:

**`limit`**
Specifies the number of campaigns that should be returned.  The default value is `1` and cannot exceed `10`. The CSA will do its best to return the number requested, but is not guaranteed, based on inventory conditions. For example, `limit=2` or `limit=5`.

**`cv`**
The custom variables to send with the request. Can be sent as either object-notated key/values, or as a URL encoded query string. For example, as an object: `cv[foo]=bar&cv[key]=value`, or as URL encoded string: `cv=foo%3Dbar%26key%3Dvalue`

**`mv`**
The custom merge values to be used inside the placement's template. Will only be applied if the variable exists within the template. Can be sent as either object-notated key/values, or as a URL encoded query string. For example, as an object: `mv[foo]=bar&mv[key]=value`, or as URL encoded string: `mv=foo%3Dbar%26key%3Dvalue`

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
[Mocha](https://mochajs.org/) and [Chai](http://chaijs.com/) are used for unit testing. All tests are found in the `/test` folder, and must contain `.spec.js` in the name in order for the file to be recognized. You can run tests via the `yarn run test` command. Preferably, the folder and file structure should mimic the `/src` directory. For example, the  file `/src/classes/auth.js` should have a corresponding test file located at `/test/classes/auth.spec.js`. While the BDD assertion style is preferred (e.g. `expect` or `should`), feel free to use the TDD `assert` style if that's more comfortable. **Note:** the test command will also execute the `lint:hard` command. In other words, if lint errors are found, the tests will also fail!

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

