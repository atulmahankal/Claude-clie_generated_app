/**
 * Database Engine Abstraction Layer
 *
 * Provides a unified interface for working with multiple database types:
 * - PostgreSQL (production-ready, supports Supabase)
 * - MySQL/MariaDB (production-ready)
 * - MongoDB (document-based)
 * - SQLite (development/testing)
 *
 * Usage:
 * ```typescript
 * import { DatabaseFactory } from '@jam/database-engine';
 *
 * const db = DatabaseFactory.create({
 *   type: 'postgres',
 *   host: 'localhost',
 *   port: 5432,
 *   database: 'mydb',
 *   username: 'user',
 *   password: 'pass'
 * });
 *
 * await db.connect();
 *
 * // Use query builder
 * const users = await db.table('users')
 *   .where('email', 'test@example.com')
 *   .first();
 *
 * // Or raw queries
 * const result = await db.query('SELECT * FROM users WHERE id = ?', [1]);
 * ```
 */

// Core interfaces and types
export * from './core/database.interface';
export * from './core/connection-manager';
export { QueryBuilder } from './core/query-builder';

// Database adapters
export { PostgresAdapter } from './adapters/postgres.adapter';
export { MySQLAdapter } from './adapters/mysql.adapter';
export { MongoDBAdapter } from './adapters/mongodb.adapter';
export { SQLiteAdapter } from './adapters/sqlite.adapter';

import { DatabaseAdapter, DatabaseConfig } from './core/database.interface';
import { ConnectionManager } from './core/connection-manager';
import { PostgresAdapter } from './adapters/postgres.adapter';
import { MySQLAdapter } from './adapters/mysql.adapter';
import { MongoDBAdapter } from './adapters/mongodb.adapter';
import { SQLiteAdapter } from './adapters/sqlite.adapter';

/**
 * Database Factory
 *
 * Creates the appropriate database adapter based on configuration
 */
export class DatabaseFactory {
  /**
   * Create a database adapter instance
   */
  static create(config: DatabaseConfig): DatabaseAdapter {
    let adapter: DatabaseAdapter;

    switch (config.type) {
      case 'postgres':
        adapter = new PostgresAdapter(config);
        break;

      case 'mysql':
        adapter = new MySQLAdapter(config);
        break;

      case 'mongodb':
        adapter = new MongoDBAdapter(config);
        break;

      case 'sqlite':
        adapter = new SQLiteAdapter(config);
        break;

      default:
        throw new Error(
          `Unsupported database type: ${config.type}. Supported types: postgres, mysql, mongodb, sqlite`
        );
    }

    return adapter;
  }

  /**
   * Create a database adapter with connection management
   */
  static createWithManager(
    config: DatabaseConfig,
    connectionName: string = 'default'
  ): DatabaseAdapter {
    const adapter = this.create(config);
    const manager = ConnectionManager.getInstance(config, connectionName);
    manager.setAdapter(adapter);

    return adapter;
  }

  /**
   * Create and connect to a database
   */
  static async createAndConnect(
    config: DatabaseConfig,
    connectionName: string = 'default'
  ): Promise<DatabaseAdapter> {
    const adapter = this.createWithManager(config, connectionName);
    await adapter.connect();
    return adapter;
  }
}

/**
 * Database Manager
 *
 * Provides a global interface for managing database connections
 */
export class Database {
  private static connections = new Map<string, DatabaseAdapter>();
  private static defaultConnectionName = 'default';

  /**
   * Add a database connection
   */
  static addConnection(
    name: string,
    config: DatabaseConfig
  ): DatabaseAdapter {
    const adapter = DatabaseFactory.createWithManager(config, name);
    this.connections.set(name, adapter);
    return adapter;
  }

  /**
   * Get a database connection
   */
  static getConnection(name: string = this.defaultConnectionName): DatabaseAdapter {
    const connection = this.connections.get(name);

    if (!connection) {
      throw new Error(
        `Database connection '${name}' not found. Available connections: ${Array.from(
          this.connections.keys()
        ).join(', ')}`
      );
    }

    return connection;
  }

  /**
   * Remove a database connection
   */
  static async removeConnection(name: string): Promise<void> {
    const connection = this.connections.get(name);

    if (connection) {
      await connection.disconnect();
      this.connections.delete(name);
    }
  }

  /**
   * Set the default connection name
   */
  static setDefaultConnection(name: string): void {
    this.defaultConnectionName = name;
  }

  /**
   * Get the default connection
   */
  static connection(): DatabaseAdapter {
    return this.getConnection(this.defaultConnectionName);
  }

  /**
   * Connect all registered connections
   */
  static async connectAll(): Promise<void> {
    const connectPromises = Array.from(this.connections.values()).map((adapter) =>
      adapter.connect()
    );
    await Promise.all(connectPromises);
  }

  /**
   * Disconnect all connections
   */
  static async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.values()).map((adapter) =>
      adapter.disconnect()
    );
    await Promise.all(disconnectPromises);
    this.connections.clear();
  }

  /**
   * Get all connection names
   */
  static getConnectionNames(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Check if a connection exists
   */
  static hasConnection(name: string): boolean {
    return this.connections.has(name);
  }
}

/**
 * Helper function to create a database connection from environment variables
 */
export function createDatabaseFromEnv(prefix: string = ''): DatabaseAdapter {
  const getEnv = (key: string): string | undefined =>
    process.env[prefix ? `${prefix}_${key}` : key];

  const type = (getEnv('DB_TYPE') || 'postgres') as DatabaseConfig['type'];

  const config: DatabaseConfig = {
    type,
    host: getEnv('DB_HOST') || 'localhost',
    port: parseInt(getEnv('DB_PORT') || '0') || undefined,
    database: getEnv('DB_NAME') || getEnv('DB_DATABASE'),
    username: getEnv('DB_USER') || getEnv('DB_USERNAME'),
    password: getEnv('DB_PASSWORD') || getEnv('DB_PASS'),
    filename: getEnv('DB_FILENAME'), // For SQLite
    uri: getEnv('DB_URI'), // For MongoDB
    ssl: getEnv('DB_SSL') === 'true',
    poolMin: parseInt(getEnv('DB_POOL_MIN') || '2'),
    poolMax: parseInt(getEnv('DB_POOL_MAX') || '10'),
    debug: getEnv('DB_DEBUG') === 'true',
  };

  return DatabaseFactory.create(config);
}

// Default export
export default Database;
