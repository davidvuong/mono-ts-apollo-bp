import { readFileSync } from 'fs';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
// import expressJwt from 'express-jwt';
// import jwks from 'jwks-rsa';
import compression from 'compression';
import morgan from 'morgan';
import { constants as httpConstants } from 'http2';
import { DecodeJsonError } from '@monots/shared';
import path from 'path';
import cors from 'cors';
import { handleHttpError } from './common/errors';
import { logger, MorganStreamWritable } from './common/logger';
import { loadConfig } from './common/config';
import { loadResolvers } from './resolvers';
import { Repository } from './repository';
import { IdentityService } from './services/identity';

const main = async (): Promise<void> => {
  const config = loadConfig(process.env);

  const app = express();
  app.disable('x-powered-by');
  app.disable('etag');
  app.use(
    cors({
      // Configures Access-Control-Allow-Origin CORS header.
      origin: ['http://localhost:3000'],

      // Configures Access-Control-Allow-Credentials CORS header. When true pass the header, otherwise omitted.
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: config.api.requestSizeLimit }));

  // NOTE: Uncomment this after configuring an application via Auth0!
  // app.use(
  //   '/graphql',
  //   expressJwt({
  //     secret: jwks.expressJwtSecret({
  //       cache: true,
  //       rateLimit: true,
  //       jwksRequestsPerMinute: 5,
  //       jwksUri: config.auth.jwksUri,
  //     }),
  //     audience: config.auth.audience,
  //     issuer: config.auth.issuer,
  //     algorithms: ['RS256'],
  //   }),
  // );

  app.use(
    // NOTE: the log format tied to stream consumer expected format specifically ':status|'
    morgan(':status|:method :url - status=:status - len=:res[content-length] - ms=:response-time', {
      skip: (req: express.Request, _res: express.Response): boolean => req.originalUrl === '/health',
      stream: new MorganStreamWritable(),
    }),
  );

  // Services & Repository
  const repository = await Repository.loadRepository(config.database);
  const identityService = new IdentityService(repository);

  const resolvers = loadResolvers(identityService);
  const apolloServer = new ApolloServer({
    typeDefs: readFileSync(`${__dirname}/schema.graphql`).toString('utf-8'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolvers: resolvers as any,
    tracing: config.api.isTracingEnbled,
    cacheControl: {
      defaultMaxAge: 0,
    },
  });
  apolloServer.applyMiddleware({ app });

  // Configure static serving of React SPA.
  const WebAppPath = path.join(__dirname, '../../..', 'webapp', 'build');
  const WebAppStaticRouter = (_req: express.Request, res: express.Response) =>
    res.sendFile(path.join(WebAppPath, 'index.html'));
  app.use(express.static(WebAppPath));
  app.get('/', WebAppStaticRouter);
  app.get('/a/*', WebAppStaticRouter);

  app.use('/', (_req, res) => res.status(httpConstants.HTTP_STATUS_NOT_FOUND).json({ error: 'Route not found' }));

  app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof SyntaxError) {
      handleHttpError(new DecodeJsonError(err.toString()), req, res);
    } else {
      handleHttpError(err, req, res);
    }
  });

  app.listen(config.api.port, () =>
    logger.info(`🚀 [${config.environment}] Server ready http://0.0.0.0:${config.api.port}${apolloServer.graphqlPath}`),
  );
};

main();
