import { MongoClient, Db, Collection, Document } from 'mongodb';
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

/**
 * MongoDB Database Adapter
 *
 * Implements database operations for MongoDB
 * Note: MongoDB uses a different query paradigm, so some SQL-like operations
 * are adapted to MongoDB's document-based approach
 */
export class MongoDBAdapter implements DatabaseAdapter {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private config: DatabaseConfig;
  private connected = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.connected && this.client) {
      return;
    }

    try {
      const uri =
        this.config.uri ||
        `mongodb://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port || 27017}/${this.config.database}`;

      this.client = new MongoClient(uri, {
        maxPoolSize: this.config.poolMax || 10,
        minPoolSize: this.config.poolMin || 2,
        serverSelectionTimeoutMS: 10000,
      });

      await this.client.connect();
      this.db = this.client.db(this.config.database);
      this.connected = true;

      if (this.config.debug) {
        console.log('[MongoDB] Connected to database:', this.config.database);
      }
    } catch (error) {
      throw new ConnectionError(
        `Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.connected = false;

      if (this.config.debug) {
        console.log('[MongoDB] Disconnected from database');
      }
    } catch (error) {
      throw new ConnectionError(
        `Failed to disconnect from MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  table(tableName: string): IQueryBuilder {
    // MongoDB doesn't use SQL queries, so we return a limited query builder
    // that translates to MongoDB operations
    throw new Error(
      'MongoDB does not support SQL query builder. Use getCollection() and MongoDB native queries instead.'
    );
  }

  /**
   * Get a MongoDB collection (equivalent to a SQL table)
   */
  getCollection<T extends Document = Document>(collectionName: string): Collection<T> {
    if (!this.db) {
      throw new ConnectionError('Not connected to database');
    }

    return this.db.collection<T>(collectionName);
  }

  /**
   * Execute a find query and return results in QueryResult format
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    throw new Error(
      'MongoDB does not support SQL queries. Use getCollection() and MongoDB native queries instead.'
    );
  }

  async beginTransaction(): Promise<Transaction> {
    if (!this.client) {
      throw new ConnectionError('Not connected to database');
    }

    const session = this.client.startSession();
    session.startTransaction();

    let isActive = true;

    return {
      async commit(): Promise<void> {
        if (!isActive) {
          throw new TransactionError('Transaction is not active');
        }

        try {
          await session.commitTransaction();
          isActive = false;
        } finally {
          await session.endSession();
        }
      },

      async rollback(): Promise<void> {
        if (!isActive) {
          throw new TransactionError('Transaction is not active');
        }

        try {
          await session.abortTransaction();
          isActive = false;
        } finally {
          await session.endSession();
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
    if (!this.db) {
      throw new ConnectionError('Not connected to database');
    }

    try {
      const collections = await this.db.listCollections({ name: tableName }).toArray();
      return collections.length > 0;
    } catch (error) {
      throw new QueryError(
        `Failed to check collection existence: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async createTable(tableName: string, callback: (table: TableBuilder) => void): Promise<void> {
    if (!this.db) {
      throw new ConnectionError('Not connected to database');
    }

    try {
      // MongoDB creates collections automatically, but we can create it explicitly
      await this.db.createCollection(tableName);

      if (this.config.debug) {
        console.log('[MongoDB] Collection created:', tableName);
      }
    } catch (error) {
      throw new QueryError(
        `Failed to create collection: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async dropTable(tableName: string): Promise<void> {
    if (!this.db) {
      throw new ConnectionError('Not connected to database');
    }

    try {
      await this.db.dropCollection(tableName);

      if (this.config.debug) {
        console.log('[MongoDB] Collection dropped:', tableName);
      }
    } catch (error) {
      throw new QueryError(
        `Failed to drop collection: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async renameTable(oldName: string, newName: string): Promise<void> {
    if (!this.db) {
      throw new ConnectionError('Not connected to database');
    }

    try {
      const collection = this.db.collection(oldName);
      await collection.rename(newName);

      if (this.config.debug) {
        console.log('[MongoDB] Collection renamed:', oldName, '->', newName);
      }
    } catch (error) {
      throw new QueryError(
        `Failed to rename collection: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async runMigration(sql: string): Promise<void> {
    throw new Error(
      'MongoDB does not support SQL migrations. Use MongoDB migration tools or native commands instead.'
    );
  }

  async ping(): Promise<boolean> {
    if (!this.db) {
      return false;
    }

    try {
      await this.db.admin().ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * MongoDB-specific: Create an index on a collection
   */
  async createIndex(
    collectionName: string,
    fields: Record<string, 1 | -1>,
    options?: { unique?: boolean; name?: string }
  ): Promise<void> {
    if (!this.db) {
      throw new ConnectionError('Not connected to database');
    }

    try {
      const collection = this.db.collection(collectionName);
      await collection.createIndex(fields, options);

      if (this.config.debug) {
        console.log('[MongoDB] Index created on', collectionName, ':', fields);
      }
    } catch (error) {
      throw new QueryError(
        `Failed to create index: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * MongoDB-specific: Aggregate query
   */
  async aggregate<T = any>(
    collectionName: string,
    pipeline: Document[]
  ): Promise<T[]> {
    if (!this.db) {
      throw new ConnectionError('Not connected to database');
    }

    try {
      const collection = this.db.collection(collectionName);
      const results = await collection.aggregate<T>(pipeline).toArray();

      if (this.config.debug) {
        console.log('[MongoDB] Aggregate query executed on', collectionName);
      }

      return results;
    } catch (error) {
      throw new QueryError(
        `Aggregate query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
