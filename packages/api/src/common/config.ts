import { Joi, validateSchemaWithThrow, LogLevel, LogLevelSchema } from '@monots/shared';

export interface LoggerConfig {
  logLevel: LogLevel;
}

export interface ApiConfig {
  port: number;
  requestSizeLimit: string;
  isTracingEnbled: boolean;
}

export interface AuthConfig {
  jwksUri: string;
  audience: string;
  issuer: string;
}

interface DatabaseSharedConfig {
  statementTimeout: number;
  minPoolSize: number;
  maxPoolSize: number;
  poolIdleTimeout: number;
}

export interface DatabaseConfigWithUri extends DatabaseSharedConfig {
  connectionUri: string;
}
export interface DatabaseConfigWithConn extends DatabaseSharedConfig {
  host: string;
  port: number;
  name: string;
  username: string;
  password: string;
}

export type DatabaseConfig = DatabaseConfigWithUri | DatabaseConfigWithConn;

export function isDatabaseConnectionUri(config: DatabaseConfig): config is DatabaseConfigWithUri {
  return (config as DatabaseConfigWithUri).connectionUri !== undefined;
}

export interface AppConfig {
  environment: string;
  logger: LoggerConfig;
  api: ApiConfig;
  auth: AuthConfig;
  database: DatabaseConfig;
}

export const getLoggerConfig = (env: NodeJS.ProcessEnv): LoggerConfig =>
  validateSchemaWithThrow(
    {
      logLevel: env.LOG_LEVEL,
    },
    Joi.object({
      logLevel: LogLevelSchema.default(LogLevel.INFO),
    }),
  );

export const getApiConfig = (env: NodeJS.ProcessEnv): ApiConfig =>
  validateSchemaWithThrow(
    {
      port: env.PORT ?? env.API_PORT,
      requestSizeLimit: env.API_REQUEST_SIZE_LIMIT ?? '10mb',
      isTracingEnbled: env.API_GQL_TRACING_ENABLED ?? false,
    },
    Joi.object({
      port: Joi.number().port().required(),
      isTracingEnbled: Joi.bool().required(),
      requestSizeLimit: Joi.string().required(),
    }),
  );

export const getAuthConfig = (env: NodeJS.ProcessEnv): AuthConfig =>
  validateSchemaWithThrow(
    {
      jwksUri: env.AUTH_JWKS_URI,
      audience: env.AUTH_AUDIENCE,
      issuer: env.AUTH_ISSUER,
    },
    Joi.object({
      jwksUri: Joi.string().uri().required(),
      audience: Joi.string().required(),
      issuer: Joi.string().required(),
    }),
  );

export const getDatabaseConfig = (env: NodeJS.ProcessEnv): DatabaseConfig => {
  const config = {
    connectionUri: env.DATABASE_URL ?? env.DB_CONNECTION_URI,
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    statementTimeout: env.DB_STATEMENT_TIMEOUT ?? 8000,
    minPoolSize: env.DB_MIN_POOL_SIZE ?? 1,
    maxPoolSize: env.DB_MAX_POOL_SIZE ?? 10,
    poolIdleTimeout: env.DB_POOL_IDLE_TIMEOUT ?? 10000,
  };
  let DatabaseConfigSchema = Joi.object({
    minPoolSize: Joi.number().min(1).required(),
    maxPoolSize: Joi.number().min(1).max(128).required(),
    poolIdleTimeout: Joi.number().positive().required(),
    statementTimeout: Joi.number().positive().required(),
  });
  if (isDatabaseConnectionUri(config as any)) {
    DatabaseConfigSchema = DatabaseConfigSchema.keys({
      connectionUri: Joi.string().required(),
    });
  } else {
    DatabaseConfigSchema = DatabaseConfigSchema.keys({
      host: Joi.string().required(),
      port: Joi.number().port().required(),
      name: Joi.string().required(),
      username: Joi.string().required(),
      password: Joi.string().required(),
    });
  }
  return validateSchemaWithThrow(config, DatabaseConfigSchema);
};

export const loadConfig = (env: NodeJS.ProcessEnv): AppConfig => ({
  ...validateSchemaWithThrow(
    {
      environment: env.NODE_ENV,
    },
    Joi.object({ environment: Joi.string().required() }),
  ),
  // Nested properties specific to a config type.
  ...{
    environment: validateSchemaWithThrow(env.NODE_ENV, Joi.string().required()),
    logger: getLoggerConfig(env),
    api: getApiConfig(env),
    auth: getAuthConfig(env),
    database: getDatabaseConfig(env),
  },
});
