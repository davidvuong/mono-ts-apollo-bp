import { exec } from 'child_process';
import crypto from 'crypto';
import { truncate } from 'lodash';
import pg, { PoolClient } from 'pg';
import { v4 } from 'uuid';
import { Utils } from '@monots/shared';
import { promisify } from 'util';
import { Repository } from '../repository';
import { QueryParam } from '../typed/QueryParam';
import { DatabaseConfigWithConn } from '../common/config';

// Private Common

const genDatabaseName = (): string =>
  truncate(`db_checksum${crypto.createHash('md5').update(v4()).digest('hex')}`, { length: 48 });

// Public Common

export const getDefaultDatabaseConfig = (options?: Partial<DatabaseConfigWithConn>): DatabaseConfigWithConn => ({
  host: 'localhost',
  port: 5432,
  name: genDatabaseName(),
  username: 'postgres',
  password: 'password',
  statementTimeout: 30 * 1000,
  minPoolSize: 1,
  maxPoolSize: 1,
  poolIdleTimeout: 30 * 1000,
  ...options,
});

export const getPostgresDatabaseConfig = (): DatabaseConfigWithConn => ({
  ...getDefaultDatabaseConfig(),
  name: 'postgres',
});

export const migrateDatabase = (config: DatabaseConfigWithConn): Promise<{ stdout: string; stderr: string }> =>
  promisify(exec)(`
    flyway migrate \
      -user=${config.username} \
      -password=${config.password} \
      -url=jdbc:postgresql://${config.host}:${config.port}/${config.name} \
      -locations=filesystem:${__dirname}/../../migrations
  `);

// Private

const DATABASE_TEMPLATE_NAME = 'test_template';

const query = (config: DatabaseConfigWithConn, q: string, params: QueryParam[] = []): Promise<pg.QueryResult> =>
  new Promise((resolve, reject) => {
    const client = new pg.Client({
      database: config.name,
      port: config.port,
      host: config.host,
      user: config.username,
      password: config.password,
    });
    client.connect();
    client.query(q, params, (err, res) => {
      client.end();
      return err ? reject(err) : resolve(res);
    });
  });

const transact = <A>(repository: Repository, f: (t: PoolClient) => Promise<A>): Promise<A> =>
  repository.transact(t => f(t));

const createDatabase = async (dbName: string): Promise<void> => {
  const config = getPostgresDatabaseConfig();
  await query(config, `CREATE DATABASE ${dbName} WITH TEMPLATE ${DATABASE_TEMPLATE_NAME}`);
};

const removeDatabaseByName = async (dbName: string): Promise<void> => {
  await query(getPostgresDatabaseConfig(), `DROP DATABASE IF EXISTS ${dbName}`);
};

const getAllTestDatabaseNames = async (): Promise<string[]> => {
  const q = `
    SELECT datname
    FROM pg_database
    WHERE datistemplate = false AND datname LIKE 'checksum%'`;
  return (await query(getPostgresDatabaseConfig(), q)).rows.map(r => r.datname);
};

const closeDatabaseConnections = async (dbName: string): Promise<void> => {
  await query(
    getPostgresDatabaseConfig(),
    `
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE pid <> pg_backend_pid() AND datname = $1
    `,
    [dbName],
  );
};

// Public

export const createDatabaseTemplate = async (): Promise<void> => {
  const config = getPostgresDatabaseConfig();

  await query(config, `DROP DATABASE IF EXISTS ${DATABASE_TEMPLATE_NAME}`);
  await query(config, `CREATE DATABASE ${DATABASE_TEMPLATE_NAME}`);
  await migrateDatabase({ ...config, name: DATABASE_TEMPLATE_NAME });
};

export const removeAllTestDatabases = async (): Promise<void> => {
  const dbNames = await getAllTestDatabaseNames();
  await Utils.map(dbNames, async name => {
    await closeDatabaseConnections(name);
    await removeDatabaseByName(name);
  });
};

export const withRepository = async (
  fn: (data: { repository: Repository; config: DatabaseConfigWithConn }) => Promise<unknown>,
): Promise<void> => {
  const config = getDefaultDatabaseConfig();
  await createDatabase(config.name);
  const repository = await Repository.loadRepository(config);

  await fn({ repository, config }).finally(() => repository.disconnect());
};
