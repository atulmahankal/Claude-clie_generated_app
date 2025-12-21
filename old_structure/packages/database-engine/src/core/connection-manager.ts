import { DatabaseAdapter, DatabaseConfig, ConnectionError } from './database.interface';

/**
 * Connection Manager
 *
 * Manages database connections, pooling, and lifecycle
 */
export class ConnectionManager {
  private static instances = new Map<string, ConnectionManager>();
  private adapter: DatabaseAdapter | null = null;
  private config: DatabaseConfig;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor(config: DatabaseConfig, private connectionName = 'default') {
    this.config = config;
  }

  /**
   * Get or create a connection manager instance
   */
  static getInstance(config: DatabaseConfig, connectionName = 'default'): ConnectionManager {
    const key = `${connectionName}:${config.type}:${config.host}:${config.database}`;

    if (!ConnectionManager.instances.has(key)) {
      ConnectionManager.instances.set(key, new ConnectionManager(config, connectionName));
    }

    return ConnectionManager.instances.get(key)!;
  }

  /**
   * Set the database adapter
   */
  setAdapter(adapter: DatabaseAdapter): void {
    this.adapter = adapter;
  }

  /**
   * Get the database adapter
   */
  getAdapter(): DatabaseAdapter {
    if (!this.adapter) {
      throw new ConnectionError('Database adapter not initialized');
    }
    return this.adapter;
  }

  /**
   * Connect to the database
   */
  async connect(): Promise<void> {
    if (this.adapter?.isConnected()) {
      return;
    }

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    if (!this.adapter) {
      throw new ConnectionError('Database adapter not set');
    }

    this.isConnecting = true;
    this.connectionPromise = this.adapter.connect();

    try {
      await this.connectionPromise;
      this.isConnecting = false;
      this.connectionPromise = null;
    } catch (error) {
      this.isConnecting = false;
      this.connectionPromise = null;
      throw new ConnectionError(
        `Failed to connect to ${this.config.type} database: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Disconnect from the database
   */
  async disconnect(): Promise<void> {
    if (!this.adapter) {
      return;
    }

    try {
      await this.adapter.disconnect();
    } catch (error) {
      throw new ConnectionError(
        `Failed to disconnect from ${this.config.type} database: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if connected
   */
  isConnectedToDatabase(): boolean {
    return this.adapter?.isConnected() ?? false;
  }

  /**
   * Reconnect to the database
   */
  async reconnect(): Promise<void> {
    await this.disconnect();
    await this.connect();
  }

  /**
   * Get connection configuration
   */
  getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  /**
   * Get connection name
   */
  getConnectionName(): string {
    return this.connectionName;
  }

  /**
   * Ping the database to check connectivity
   */
  async ping(): Promise<boolean> {
    if (!this.adapter) {
      return false;
    }

    try {
      return await this.adapter.ping();
    } catch (error) {
      return false;
    }
  }

  /**
   * Close all connections
   */
  static async closeAll(): Promise<void> {
    const disconnectPromises = Array.from(ConnectionManager.instances.values()).map((manager) =>
      manager.disconnect()
    );

    await Promise.all(disconnectPromises);
    ConnectionManager.instances.clear();
  }

  /**
   * Get all connection names
   */
  static getConnectionNames(): string[] {
    return Array.from(ConnectionManager.instances.keys());
  }

  /**
   * Remove a connection from the pool
   */
  static removeConnection(connectionName: string): void {
    const keysToRemove: string[] = [];

    for (const [key, manager] of ConnectionManager.instances.entries()) {
      if (manager.getConnectionName() === connectionName) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      ConnectionManager.instances.get(key)?.disconnect();
      ConnectionManager.instances.delete(key);
    });
  }
}
