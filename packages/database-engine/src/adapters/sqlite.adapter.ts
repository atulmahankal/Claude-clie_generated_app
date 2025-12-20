import Database from 'better-sqlite3';
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
 * SQLite Database Adapter
 *
 * Implements database operations for SQLite using better-sqlite3
 * Ideal for development, testing, and embedded applications
 */
export class SQLiteAdapter implements DatabaseAdapter {
  private db: Database.Database | null = null;
  private config: DatabaseConfig;
  private connected = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.connected && this.db) {
      return;
    }

    try {
      const filename = this.config.filename || this.config.database || ':memory:';

      this.db = new Database(filename, {
        verbose: this.config.debug ? console.log : undefined,
      });

      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');

      // Set WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');

      this.connected = true;

      if (this.config.debug) {
        console.log('[SQLite] Connected to database:', filename);
      }
    } catch (error) {
      throw new ConnectionError(
        `Failed to connect to SQLite: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async disconnect(): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      this.db.close();
      this.db = null;
      this.connected = false;

      if (this.config.debug) {
        console.log('[SQLite] Disconnected from database');
      }
    } catch (error) {
      throw new ConnectionError(
        `Failed to disconnect from SQLite: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    if (!this.db) {
      throw new ConnectionError('Not connected to database');
    }

    try {
      if (this.config.debug) {
        console.log('[SQLite Query]', sql);
        console.log('[SQLite Params]', params);
      }

      // Determine query type
      const trimmedSql = sql.trim().toUpperCase();
      const isSelect =
        trimmedSql.startsWith('SELECT') ||
        trimmedSql.startsWith('PRAGMA') ||
        trimmedSql.startsWith('EXPLAIN');

      if (isSelect) {
        // SELECT queries
        const stmt = this.db.prepare(sql);
        const rows = stmt.all(...params) as T[];

        return {
          rows,
          rowCount: rows.length,
        };
      } else {
        // INSERT, UPDATE, DELETE queries
        const stmt = this.db.prepare(sql);
        const info = stmt.run(...params);

        let rows: T[] = [];

        // For INSERT, return the inserted ID
        if (trimmedSql.startsWith('INSERT') && info.lastInsertRowid) {
          rows = [{ id: info.lastInsertRowid } as T];
        }

        return {
          rows,
          rowCount: info.changes,
        };
      }
    } catch (error: any) {
      throw new QueryError(
        `SQLite query failed: ${error.message}`,
        sql,
        params,
        error.code
      );
    }
  }

  async beginTransaction(): Promise<Transaction> {
    if (!this.db) {
      throw new ConnectionError('Not connected to database');
    }

    this.db.prepare('BEGIN').run();

    let isActive = true;
    const db = this.db;

    return {
      async commit(): Promise<void> {
        if (!isActive) {
          throw new TransactionError('Transaction is not active');
        }

        try {
          db.prepare('COMMIT').run();
          isActive = false;
        } catch (error) {
          throw new TransactionError(
            `Failed to commit transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      },

      async rollback(): Promise<void> {
        if (!isActive) {
          throw new TransactionError('Transaction is not active');
        }

        try {
          db.prepare('ROLLBACK').run();
          isActive = false;
        } catch (error) {
          throw new TransactionError(
            `Failed to rollback transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
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
       FROM sqlite_master
       WHERE type='table'
       AND name=?`,
      [tableName]
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
    await this.query(`ALTER TABLE ${oldName} RENAME TO ${newName}`);
  }

  async runMigration(sql: string): Promise<void> {
    if (!this.db) {
      throw new ConnectionError('Not connected to database');
    }

    try {
      // SQLite doesn't support multiple statements in a single query
      // Split by semicolon and execute each statement
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      this.db.prepare('BEGIN').run();

      try {
        for (const statement of statements) {
          this.db.prepare(statement).run();
        }

        this.db.prepare('COMMIT').run();

        if (this.config.debug) {
          console.log('[SQLite] Migration executed successfully');
        }
      } catch (error) {
        this.db.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      throw new QueryError(
        `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sql
      );
    }
  }

  async ping(): Promise<boolean> {
    if (!this.db) {
      return false;
    }

    try {
      this.db.prepare('SELECT 1').get();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * SQLite-specific: Execute a pragma statement
   */
  pragma(pragma: string): any {
    if (!this.db) {
      throw new ConnectionError('Not connected to database');
    }

    return this.db.pragma(pragma);
  }

  /**
   * SQLite-specific: Backup database to a file
   */
  async backup(filename: string): Promise<void> {
    if (!this.db) {
      throw new ConnectionError('Not connected to database');
    }

    return new Promise((resolve, reject) => {
      try {
        this.db!.backup(filename)
          .then(() => {
            if (this.config.debug) {
              console.log('[SQLite] Backup created:', filename);
            }
            resolve();
          })
          .catch(reject);
      } catch (error) {
        reject(
          new QueryError(
            `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        );
      }
    });
  }
}
