/**
 * Database Engine Abstraction Layer
 *
 * Provides a unified interface for working with multiple database types
 * (PostgreSQL, MySQL, MongoDB, SQLite) similar to Laravel/CakePHP ORM
 */

export interface DatabaseConfig {
  type: 'postgres' | 'mysql' | 'mongodb' | 'sqlite';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  filename?: string; // For SQLite
  uri?: string; // For MongoDB
  ssl?: boolean;
  poolMin?: number;
  poolMax?: number;
  debug?: boolean;
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  fields?: string[];
}

export interface Transaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive(): boolean;
}

export interface WhereCondition {
  field: string;
  operator: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'IN' | 'NOT IN' | 'IS NULL' | 'IS NOT NULL';
  value?: any;
}

export interface JoinCondition {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  table: string;
  on: {
    left: string;
    operator: string;
    right: string;
  };
}

export interface QueryBuilder {
  // Select operations
  select(...fields: string[]): QueryBuilder;
  from(table: string): QueryBuilder;
  where(field: string, operator: string, value?: any): QueryBuilder;
  whereRaw(condition: string, bindings?: any[]): QueryBuilder;
  orWhere(field: string, operator: string, value?: any): QueryBuilder;
  whereIn(field: string, values: any[]): QueryBuilder;
  whereNotIn(field: string, values: any[]): QueryBuilder;
  whereNull(field: string): QueryBuilder;
  whereNotNull(field: string): QueryBuilder;
  whereBetween(field: string, values: [any, any]): QueryBuilder;

  // Joins
  join(table: string, first: string, operator: string, second: string): QueryBuilder;
  leftJoin(table: string, first: string, operator: string, second: string): QueryBuilder;
  rightJoin(table: string, first: string, operator: string, second: string): QueryBuilder;

  // Aggregations
  count(field?: string): QueryBuilder;
  sum(field: string): QueryBuilder;
  avg(field: string): QueryBuilder;
  min(field: string): QueryBuilder;
  max(field: string): QueryBuilder;

  // Grouping and ordering
  groupBy(...fields: string[]): QueryBuilder;
  having(field: string, operator: string, value: any): QueryBuilder;
  orderBy(field: string, direction?: 'ASC' | 'DESC'): QueryBuilder;

  // Limiting
  limit(count: number): QueryBuilder;
  offset(count: number): QueryBuilder;

  // Execution
  get<T = any>(): Promise<T[]>;
  first<T = any>(): Promise<T | null>;
  pluck<T = any>(field: string): Promise<T[]>;

  // Insert operations
  insert(data: Record<string, any> | Record<string, any>[]): Promise<any>;

  // Update operations
  update(data: Record<string, any>): Promise<number>;

  // Delete operations
  delete(): Promise<number>;

  // Increment/Decrement
  increment(field: string, amount?: number): Promise<number>;
  decrement(field: string, amount?: number): Promise<number>;

  // Raw query
  raw(sql: string, bindings?: any[]): Promise<QueryResult>;

  // Get SQL
  toSql(): string;
  getBindings(): any[];
}

export interface DatabaseAdapter {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Query builder
  table(tableName: string): QueryBuilder;

  // Raw queries
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;

  // Transaction management
  beginTransaction(): Promise<Transaction>;
  transaction<T>(callback: (trx: Transaction) => Promise<T>): Promise<T>;

  // Schema operations
  hasTable(tableName: string): Promise<boolean>;
  createTable(tableName: string, callback: (table: TableBuilder) => void): Promise<void>;
  dropTable(tableName: string): Promise<void>;
  renameTable(oldName: string, newName: string): Promise<void>;

  // Migration support
  runMigration(sql: string): Promise<void>;

  // Health check
  ping(): Promise<boolean>;
}

export interface TableBuilder {
  // Column types
  increments(name: string): ColumnBuilder;
  integer(name: string): ColumnBuilder;
  bigInteger(name: string): ColumnBuilder;
  string(name: string, length?: number): ColumnBuilder;
  text(name: string): ColumnBuilder;
  boolean(name: string): ColumnBuilder;
  date(name: string): ColumnBuilder;
  datetime(name: string): ColumnBuilder;
  timestamp(name: string): ColumnBuilder;
  decimal(name: string, precision?: number, scale?: number): ColumnBuilder;
  float(name: string): ColumnBuilder;
  json(name: string): ColumnBuilder;
  uuid(name: string): ColumnBuilder;

  // Timestamps
  timestamps(useTimestamps?: boolean, defaultToNow?: boolean): void;

  // Indexes
  primary(columns: string | string[]): void;
  unique(columns: string | string[], indexName?: string): void;
  index(columns: string | string[], indexName?: string): void;

  // Foreign keys
  foreign(column: string): ForeignKeyBuilder;
}

export interface ColumnBuilder {
  nullable(): ColumnBuilder;
  notNullable(): ColumnBuilder;
  defaultTo(value: any): ColumnBuilder;
  unsigned(): ColumnBuilder;
  unique(): ColumnBuilder;
  primary(): ColumnBuilder;
  references(column: string): ForeignKeyBuilder;
  comment(comment: string): ColumnBuilder;
}

export interface ForeignKeyBuilder {
  references(column: string): ForeignKeyBuilder;
  inTable(table: string): ForeignKeyBuilder;
  onDelete(action: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'): ForeignKeyBuilder;
  onUpdate(action: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'): ForeignKeyBuilder;
}

export interface Model<T = any> {
  // Table configuration
  table: string;
  primaryKey?: string;
  timestamps?: boolean;

  // CRUD operations
  find(id: any): Promise<T | null>;
  findOrFail(id: any): Promise<T>;
  findBy(field: string, value: any): Promise<T | null>;
  findAll(conditions?: Record<string, any>): Promise<T[]>;

  create(data: Partial<T>): Promise<T>;
  update(id: any, data: Partial<T>): Promise<T>;
  delete(id: any): Promise<boolean>;

  // Query builder
  query(): QueryBuilder;

  // Relationships
  hasOne<R>(model: Model<R>, foreignKey: string, localKey?: string): Promise<R | null>;
  hasMany<R>(model: Model<R>, foreignKey: string, localKey?: string): Promise<R[]>;
  belongsTo<R>(model: Model<R>, foreignKey: string, ownerKey?: string): Promise<R | null>;
  belongsToMany<R>(
    model: Model<R>,
    pivotTable: string,
    foreignPivotKey: string,
    relatedPivotKey: string
  ): Promise<R[]>;
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public query?: string,
    public params?: any[]
  ) {
    super(message);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class ConnectionError extends DatabaseError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'ConnectionError';
    Object.setPrototypeOf(this, ConnectionError.prototype);
  }
}

export class QueryError extends DatabaseError {
  constructor(message: string, query?: string, params?: any[], code?: string) {
    super(message, code, query, params);
    this.name = 'QueryError';
    Object.setPrototypeOf(this, QueryError.prototype);
  }
}

export class TransactionError extends DatabaseError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'TransactionError';
    Object.setPrototypeOf(this, TransactionError.prototype);
  }
}
