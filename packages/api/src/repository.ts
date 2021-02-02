import { Pool, PoolClient, PoolConfig, types } from 'pg';
import SQL from 'sql-template-strings';
import { Nullable, Utils } from '@monots/shared';
import { includes, isUndefined, snakeCase } from 'lodash';
import { RepositoryError } from './common/errors';
import { DatabaseConfig, isDatabaseConnectionUri } from './common/config';
import { logger } from './common/logger';
import { QueryParam } from './typed/QueryParam';

export class Repository {
  private constructor(private readonly pool: Pool, readonly tableColumns: Record<string, string[]>) {}

  private static runTransaction = <A>(func: (transaction: PoolClient) => Promise<A>, pool: Pool): Promise<A> =>
    new Promise((resolve, reject) => {
      pool.connect(async (err, transaction, release) => {
        if (err) {
          logger.error(`Encountered error while connecting to db - err=${err.message}`);
          if (err.stack) {
            logger.error(err.stack);
          }
          release();
          reject(new RepositoryError(`Couldn't connect to database`));
          return;
        }

        try {
          await transaction.query('BEGIN');
          const response = await func(transaction);
          await transaction.query('COMMIT');
          resolve(response);
        } catch (transactionErr) {
          logger.error(`Error on execution, ROLLBACK due to error - err=${transactionErr.message}`);
          if (transactionErr.stack) {
            logger.error(transactionErr.stack);
          }
          await transaction.query('ROLLBACK');
          if (transactionErr instanceof RepositoryError) {
            reject(err);
          } else {
            reject(new RepositoryError(transactionErr.message));
          }
        } finally {
          release();
        }
      });
    });

  private static getTableColumns = async (tableName: string, transaction: PoolClient): Promise<string[]> =>
    (
      await transaction.query(SQL`SELECT column_name FROM information_schema.columns WHERE table_name = ${tableName}`)
    ).rows.map(r => r.column_name);

  static loadRepository = async (config: DatabaseConfig): Promise<Repository> => {
    // NOTE: The `oid` type in `setTypeParser` represents the `typelem` field in `SELECT * FROM pg_type`.
    //
    // @see: https://github.com/brianc/node-pg-types
    types.setTypeParser(1700, (value: string) => parseFloat(value));
    types.setTypeParser(1184, (value: string) => new Date(value).getTime());

    let poolConfig: PoolConfig = {
      min: config.minPoolSize,
      max: config.maxPoolSize,
      idleTimeoutMillis: config.poolIdleTimeout,
      statement_timeout: config.statementTimeout,
    };
    if (isDatabaseConnectionUri(config)) {
      poolConfig = { ...poolConfig, connectionString: config.connectionUri };
    } else {
      poolConfig = {
        ...poolConfig,
        database: config.name,
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
      };
    }
    const pool = new Pool(poolConfig);

    const tableNames = ['tests', 'referrers', 'modalities', 'bookings', 'slots'];
    const tableColumns = await Repository.runTransaction(
      async t =>
        (
          await Utils.map(tableNames, async tableName => ({
            tableName,
            columns: await Repository.getTableColumns(tableName, t),
          }))
        ).reduce((acc, { tableName, columns }) => {
          acc[tableName] = columns;
          return acc;
        }, {} as Record<string, string[]>),
      pool,
    );

    return new Repository(pool, tableColumns);
  };

  disconnect = (): Promise<void> => this.pool.end();

  transact = <A>(func: (transaction: PoolClient) => Promise<A>, transaction?: PoolClient): Promise<A> =>
    transaction ? func(transaction) : Repository.runTransaction(func, this.pool);

  toSelect = (tableNames: string[]): string =>
    tableNames
      .flatMap(tableName => this.tableColumns[tableName].map(f => `${tableName}.${f} AS ${tableName}_${f}`))
      .join(', ');

  toParamsString = (qp: QueryParam[], startIdx = 1): string =>
    `(${qp.map((_, idx) => `$${idx + startIdx}`).join(',')})`;

  // Generic CRUD queries.

  create = <A, B>(
    options: { tableName: string; resource: A; transformer: (row: any) => B },
    transaction?: PoolClient,
  ): Promise<B> =>
    this.transact(async t => {
      const resourceKeys = Object.keys(options.resource);

      const sqlInsertColumns = resourceKeys.map(f => snakeCase(f)).join(', ');
      const sqlInsertParams: QueryParam[] = resourceKeys.map(k => options.resource[k]);
      const sqlInsertValues = this.toParamsString(sqlInsertParams);

      const query = `INSERT INTO ${options.tableName} (${sqlInsertColumns}) VALUES ${sqlInsertValues} RETURNING *`;
      const res = await t.query(query, sqlInsertParams);
      if (res.rows.length !== 1) {
        throw new RepositoryError(`Failed to create resource - tableName${options.tableName}`);
      }
      return options.transformer(res.rows[0]);
    }, transaction);

  getAll = <A>(
    options: {
      tableName: string;
      orderBy?: string;
      transformer: (row: any) => A;
    },
    transaction?: PoolClient,
  ): Promise<A[]> =>
    this.transact(async t => {
      const query = `SELECT * FROM ${options.tableName} ORDER BY ${options.orderBy ?? 'id'} ASC`;
      return (await t.query(query)).rows.map(options.transformer);
    }, transaction);

  deleteAll = (options: { tableName: string }, transaction?: PoolClient): Promise<void> =>
    this.transact(async t => {
      await t.query(`DELETE FROM ${options.tableName}`);
    }, transaction);

  count = (options: { tableName: string }, transaction?: PoolClient): Promise<number> =>
    this.transact(
      async t => parseInt((await t.query(`SELECT COUNT(*) AS c FROM ${options.tableName}`)).rows[0].c, 10),
      transaction,
    );

  update = <A>(
    options: {
      id: string;
      tableName: string;
      attributes: Nullable<Partial<A>>;
    },
    transaction?: PoolClient,
  ): Promise<void> =>
    this.transact(async t => {
      const { id, tableName, attributes } = options;
      const params: QueryParam[] = [id];
      const sqlSets = Object.keys(attributes)
        // Treat NULL and undefined separately and filter out blacklisted fields.
        .filter(k => !isUndefined(attributes[k] || includes(['id', 'createdAt'], k)))
        .map((k, idx) => {
          const value = attributes[k] instanceof Date ? attributes[k].toISOString() : attributes[k];
          params.push(value);
          return `${snakeCase(k)} = $${idx + 2}`;
        })
        .join(', ');
      if (sqlSets.length === 0) {
        throw new RepositoryError(`Failed to update Resource, empty attributes - id=${id}`);
      }
      const query = `UPDATE ${tableName} SET ${sqlSets} WHERE id = $1`;
      const res = await t.query(query, params);
      if (res.rowCount !== 1) {
        throw new RepositoryError(`Failed to update Resource, unknown reason - id=${id}`);
      }
    }, transaction);
}
