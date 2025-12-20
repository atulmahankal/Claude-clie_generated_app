import { Pool, PoolClient, QueryResult as PgQueryResult } from 'pg';
import {
  DatabaseAdapter,
  DatabaseConfig,
  QueryBuilder as IQueryBuilder,
  QueryResult,
  Transaction,
  TableBuilder,
  ConnectionError,
  QueryError,
  TransactionError,
} from '../core/database.interface';
import { QueryBuilder } from '../core/query-builder';

/**
 * PostgreSQL Database Adapter
 *
 * Implements database operations for PostgreSQL using node-postgres (pg)
 */
export class PostgresAdapter implements DatabaseAdapter {
  private pool: Pool | null = null;
  private config: DatabaseConfig;
  private connected = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.connected && this.pool) {
      return;
    }

    // Retry logic for connection with exponential backoff
    const maxRetries = 5;
    const initialDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.pool = new Pool({
          host: this.config.host,
          port: this.config.port || 5432,
          database: this.config.database,
          user: this.config.username,
          password: this.config.password,
          ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
          min: this.config.poolMin || 2,
          max: this.config.poolMax || 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        });

        // Test the connection
        const client = await this.pool.connect();
        client.release();

        this.connected = true;

        if (this.config.debug || attempt > 1) {
          console.log(`[PostgreSQL] Connected to database: ${this.config.database} (attempt ${attempt}/${maxRetries})`);
        }

        return; // Success!
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';

        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt - 1);
          console.log(`[PostgreSQL] Connection attempt ${attempt}/${maxRetries} failed: ${errorMsg}. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));

          // Clean up failed pool before retry
          if (this.pool) {
            try {
              await this.pool.end();
            } catch {}
            this.pool = null;
          }
        } else {
          // Final attempt failed
          throw new ConnectionError(
            `Failed to connect to PostgreSQL after ${maxRetries} attempts: ${errorMsg}`
          );
        }
      }
    }
  }

  async disconnect(): Promise<void> {
    if (!this.pool) {
      return;
    }

    try {
      await this.pool.end();
      this.pool = null;
      this.connected = false;

      if (this.config.debug) {
        console.log('[PostgreSQL] Disconnected from database');
      }
    } catch (error) {
      throw new ConnectionError(
        `Failed to disconnect from PostgreSQL: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  table(tableName: string): IQueryBuilder {
    const executor = async (sql: string, bindings: any[]): Promise<QueryResult> => {
      return this.query(sql, bindings);
    };

    const queryBuilder = new QueryBuilder(executor);
    return queryBuilder.from(tableName);
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new ConnectionError('Not connected to database');
    }

    try {
      // Convert ? placeholders to PostgreSQL $1, $2, etc.
      const pgSql = this.convertPlaceholders(sql);

      if (this.config.debug) {
        console.log('[PostgreSQL Query]', pgSql);
        console.log('[PostgreSQL Params]', params);
      }

      const result: PgQueryResult<T> = await this.pool.query(pgSql, params);

      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        fields: result.fields?.map((field) => field.name),
      };
    } catch (error: any) {
      throw new QueryError(
        `PostgreSQL query failed: ${error.message}`,
        sql,
        params,
        error.code
      );
    }
  }

  async beginTransaction(): Promise<Transaction> {
    if (!this.pool) {
      throw new ConnectionError('Not connected to database');
    }

    const client = await this.pool.connect();
    await client.query('BEGIN');

    let isActive = true;

    return {
      async commit(): Promise<void> {
        if (!isActive) {
          throw new TransactionError('Transaction is not active');
        }

        try {
          await client.query('COMMIT');
          isActive = false;
        } finally {
          client.release();
        }
      },

      async rollback(): Promise<void> {
        if (!isActive) {
          throw new TransactionError('Transaction is not active');
        }

        try {
          await client.query('ROLLBACK');
          isActive = false;
        } finally {
          client.release();
        }
      },

      isActive(): boolean {
        return isActive;
      },
    };
  }

  async transaction<T>(callback: (trx: Transaction) => Promise<T>): Promise<T> {
    const trx = await this.beginTransaction();

    try {
      const result = await callback(trx);
      await trx.commit();
      return result;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async hasTable(tableName: string): Promise<boolean> {
    const result = await this.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = $1
      )`,
      [tableName]
    );

    return result.rows[0]?.exists || false;
  }

  async createTable(tableName: string, callback: (table: TableBuilder) => void): Promise<void> {
    // This would require a full table builder implementation
    // For now, we'll throw an error directing users to use migrations
    throw new Error(
      'createTable is not implemented. Please use SQL migrations for schema changes.'
    );
  }

  async dropTable(tableName: string): Promise<void> {
    await this.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
  }

  async renameTable(oldName: string, newName: string): Promise<void> {
    await this.query(`ALTER TABLE ${oldName} RENAME TO ${newName}`);
  }

  async runMigration(sql: string): Promise<void> {
    if (!this.pool) {
      throw new ConnectionError('Not connected to database');
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');

      if (this.config.debug) {
        console.log('[PostgreSQL] Migration executed successfully');
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw new QueryError(
        `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sql
      );
    } finally {
      client.release();
    }
  }

  async ping(): Promise<boolean> {
    if (!this.pool) {
      return false;
    }

    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert ? placeholders to PostgreSQL $1, $2, etc.
   */
  private convertPlaceholders(sql: string): string {
    let index = 0;
    return sql.replace(/\?/g, () => {
      index++;
      return `$${index}`;
    });
  }
}
