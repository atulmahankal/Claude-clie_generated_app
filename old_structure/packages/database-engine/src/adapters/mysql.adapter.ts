import mysql from 'mysql2/promise';
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
 * MySQL Database Adapter
 *
 * Implements database operations for MySQL/MariaDB using mysql2
 */
export class MySQLAdapter implements DatabaseAdapter {
  private pool: mysql.Pool | null = null;
  private config: DatabaseConfig;
  private connected = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.connected && this.pool) {
      return;
    }

    try {
      this.pool = mysql.createPool({
        host: this.config.host,
        port: this.config.port || 3306,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl ? { rejectUnauthorized: false } : undefined,
        connectionLimit: this.config.poolMax || 10,
        waitForConnections: true,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });

      // Test the connection
      const connection = await this.pool.getConnection();
      connection.release();

      this.connected = true;

      if (this.config.debug) {
        console.log('[MySQL] Connected to database:', this.config.database);
      }
    } catch (error) {
      throw new ConnectionError(
        `Failed to connect to MySQL: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
        console.log('[MySQL] Disconnected from database');
      }
    } catch (error) {
      throw new ConnectionError(
        `Failed to disconnect from MySQL: ${error instanceof Error ? error.message : 'Unknown error'}`
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
      if (this.config.debug) {
        console.log('[MySQL Query]', sql);
        console.log('[MySQL Params]', params);
      }

      const [rows, fields] = await this.pool.execute(sql, params);

      // Handle different result types
      let resultRows: T[] = [];
      let rowCount = 0;

      if (Array.isArray(rows)) {
        resultRows = rows as T[];
        rowCount = rows.length;
      } else if (typeof rows === 'object' && 'affectedRows' in rows) {
        // INSERT, UPDATE, DELETE results
        rowCount = (rows as any).affectedRows;
        // For INSERT, return the insertId
        if ((rows as any).insertId) {
          resultRows = [{ id: (rows as any).insertId } as T];
        }
      }

      return {
        rows: resultRows,
        rowCount,
        fields: Array.isArray(fields)
          ? fields.map((field: any) => field.name)
          : undefined,
      };
    } catch (error: any) {
      throw new QueryError(
        `MySQL query failed: ${error.message}`,
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

    const connection = await this.pool.getConnection();
    await connection.beginTransaction();

    let isActive = true;

    return {
      async commit(): Promise<void> {
        if (!isActive) {
          throw new TransactionError('Transaction is not active');
        }

        try {
          await connection.commit();
          isActive = false;
        } finally {
          connection.release();
        }
      },

      async rollback(): Promise<void> {
        if (!isActive) {
          throw new TransactionError('Transaction is not active');
        }

        try {
          await connection.rollback();
          isActive = false;
        } finally {
          connection.release();
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
      `SELECT COUNT(*) as count
       FROM information_schema.tables
       WHERE table_schema = ?
       AND table_name = ?`,
      [this.config.database, tableName]
    );

    return result.rows[0]?.count > 0;
  }

  async createTable(tableName: string, callback: (table: TableBuilder) => void): Promise<void> {
    throw new Error(
      'createTable is not implemented. Please use SQL migrations for schema changes.'
    );
  }

  async dropTable(tableName: string): Promise<void> {
    await this.query(`DROP TABLE IF EXISTS ${tableName}`);
  }

  async renameTable(oldName: string, newName: string): Promise<void> {
    await this.query(`RENAME TABLE ${oldName} TO ${newName}`);
  }

  async runMigration(sql: string): Promise<void> {
    if (!this.pool) {
      throw new ConnectionError('Not connected to database');
    }

    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();
      await connection.query(sql);
      await connection.commit();

      if (this.config.debug) {
        console.log('[MySQL] Migration executed successfully');
      }
    } catch (error) {
      await connection.rollback();
      throw new QueryError(
        `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sql
      );
    } finally {
      connection.release();
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
}
