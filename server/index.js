let time = require('@expo/time');
let _tkLoaded = time.start();
let _tkPrimedAndStarted = time.start();

let bodyParser = require('body-parser');
let cors = require('cors');
let escapeHtml = require('escape-html');
let graphqlYoga = require('graphql-yoga');
let spawnAsync = require('@expo/spawn-async');

let Api = require('./Api');
let db = require('./db');
let handler = require('./handler');
let loaders = require('./loaders');
let model = require('./model');
let resolvers = require('./resolvers');
let typeDefs = require('./typeDefs');

let makeGraphqlContextAsync = async ({ request }) => {
  let clientId = request.get('X-ClientId');
  let userId = await model.getUserIdForSessionAsync(clientId);
  return {
    request,
    loaders: loaders.createLoaders(),
    clientId,
    userId,
  };
};

async function serveAsync(port) {
  let endpoints = {
    status: '/status',
    api: '/api',
    graphql: '/api/graphql',
    playground: '/api/graphql',
    subscriptions: '/subscriptions',
  };

  let app = new graphqlYoga.GraphQLServer({
    typeDefs,
    resolvers,
    context: makeGraphqlContextAsync,
  });
  app.use(cors());
  app.use(bodyParser.json());
  app.get(endpoints.status, async (req, res) => {
    res.json({ status: 'OK' });
  });
  app.post(
    endpoints.api,
    handler(Api, {
      serverContext: async (thinContext, { req, res }) => {
        let graphqlContext = await makeGraphqlContextAsync({request: req});
        return {
          requestContext: thinContext,
          executableSchema: app.executableSchema,
          graphqlContext,
          req,
          res,
        };
      },
    })
  );
  Api.__executableSchema = app.executableSchema;

  // Homepage with some info
  app.get('/', async (req, res) => {
    let pkg = require('./package');
    let gitResult = await spawnAsync('git', ['log', '--pretty=oneline', '-n1']);
    let links = [];
    for (let name in endpoints) {
      links.push(
        '    ' +
          name +
          '  ' +
          '<a href=' +
          JSON.stringify(endpoints[name]) +
          '>' +
          endpoints[name] +
          '</a>'
      );
    }

    let title = '👻 ' + pkg.name + ' v' + pkg.version;
    res.send(
      '<title>' +
        title +
        '</title>' +
        '<pre>' +
        title +
        '<br /><br /><a href="' +
        pkg.repository +
        '">' +
        escapeHtml(gitResult.stdout) +
        '</a><br />' +
        links.join('\n') +
        '</pre>'
    );
  });

  // Report the time it takes to load all the code separate
  // from the time it takes to connect to the database
  time.end(_tkLoaded, 'loaded');

  // Make a connection to the database so its ready to go
  await db.queryAsync('SELECT 1 AS primed');

  // Start the server
  port = port || process.env.PORT || 1380;
  app.start(
    {
      port,
      endpoint: endpoints.graphql,
      subscriptions: endpoints.subscriptions,
      playground: endpoints.playground,
    },
    (info) => {
      time.end(_tkPrimedAndStarted, 'server-start');
      console.log('Ghost server listening on port ' + info.port);
      console.log('http://localhost:' + port + '/');
    }
  );

  return app;
}

module.exports = serveAsync;

if (require.main === module) {
  serveAsync();
}
