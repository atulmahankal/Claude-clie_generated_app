import { QueryBuilder as IQueryBuilder, QueryResult, QueryError } from './database.interface';

/**
 * Universal Query Builder
 *
 * Provides a fluent interface for building SQL queries across different databases
 */
export class QueryBuilder implements IQueryBuilder {
  private _select: string[] = ['*'];
  private _from: string = '';
  private _where: string[] = [];
  private _orWhere: string[] = [];
  private _joins: string[] = [];
  private _groupBy: string[] = [];
  private _having: string[] = [];
  private _orderBy: string[] = [];
  private _limitValue: number | null = null;
  private _offsetValue: number | null = null;
  private _bindings: any[] = [];
  private executor: (sql: string, bindings: any[]) => Promise<QueryResult>;

  constructor(executor: (sql: string, bindings: any[]) => Promise<QueryResult>) {
    this.executor = executor;
  }

  // Select operations
  select(...fields: string[]): QueryBuilder {
    this._select = fields.length > 0 ? fields : ['*'];
    return this;
  }

  from(table: string): QueryBuilder {
    this._from = table;
    return this;
  }

  where(field: string, operator: string, value?: any): QueryBuilder {
    // Handle two-argument form: where('field', 'value') => where('field', '=', 'value')
    if (value === undefined) {
      value = operator;
      operator = '=';
    }

    if (operator.toUpperCase() === 'IS NULL' || operator.toUpperCase() === 'IS NOT NULL') {
      this._where.push(`${field} ${operator.toUpperCase()}`);
    } else {
      this._where.push(`${field} ${operator} ?`);
      this._bindings.push(value);
    }

    return this;
  }

  whereRaw(condition: string, bindings: any[] = []): QueryBuilder {
    this._where.push(condition);
    this._bindings.push(...bindings);
    return this;
  }

  orWhere(field: string, operator: string, value?: any): QueryBuilder {
    if (value === undefined) {
      value = operator;
      operator = '=';
    }

    this._orWhere.push(`${field} ${operator} ?`);
    this._bindings.push(value);
    return this;
  }

  whereIn(field: string, values: any[]): QueryBuilder {
    const placeholders = values.map(() => '?').join(', ');
    this._where.push(`${field} IN (${placeholders})`);
    this._bindings.push(...values);
    return this;
  }

  whereNotIn(field: string, values: any[]): QueryBuilder {
    const placeholders = values.map(() => '?').join(', ');
    this._where.push(`${field} NOT IN (${placeholders})`);
    this._bindings.push(...values);
    return this;
  }

  whereNull(field: string): QueryBuilder {
    this._where.push(`${field} IS NULL`);
    return this;
  }

  whereNotNull(field: string): QueryBuilder {
    this._where.push(`${field} IS NOT NULL`);
    return this;
  }

  whereBetween(field: string, values: [any, any]): QueryBuilder {
    this._where.push(`${field} BETWEEN ? AND ?`);
    this._bindings.push(values[0], values[1]);
    return this;
  }

  // Joins
  join(table: string, first: string, operator: string, second: string): QueryBuilder {
    this._joins.push(`INNER JOIN ${table} ON ${first} ${operator} ${second}`);
    return this;
  }

  leftJoin(table: string, first: string, operator: string, second: string): QueryBuilder {
    this._joins.push(`LEFT JOIN ${table} ON ${first} ${operator} ${second}`);
    return this;
  }

  rightJoin(table: string, first: string, operator: string, second: string): QueryBuilder {
    this._joins.push(`RIGHT JOIN ${table} ON ${first} ${operator} ${second}`);
    return this;
  }

  // Aggregations
  count(field: string = '*'): QueryBuilder {
    this._select = [`COUNT(${field}) as count`];
    return this;
  }

  sum(field: string): QueryBuilder {
    this._select = [`SUM(${field}) as sum`];
    return this;
  }

  avg(field: string): QueryBuilder {
    this._select = [`AVG(${field}) as avg`];
    return this;
  }

  min(field: string): QueryBuilder {
    this._select = [`MIN(${field}) as min`];
    return this;
  }

  max(field: string): QueryBuilder {
    this._select = [`MAX(${field}) as max`];
    return this;
  }

  // Grouping and ordering
  groupBy(...fields: string[]): QueryBuilder {
    this._groupBy.push(...fields);
    return this;
  }

  having(field: string, operator: string, value: any): QueryBuilder {
    this._having.push(`${field} ${operator} ?`);
    this._bindings.push(value);
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder {
    this._orderBy.push(`${field} ${direction}`);
    return this;
  }

  // Limiting
  limit(count: number): QueryBuilder {
    this._limitValue = count;
    return this;
  }

  offset(count: number): QueryBuilder {
    this._offsetValue = count;
    return this;
  }

  // Execution methods
  async get<T = any>(): Promise<T[]> {
    const sql = this.buildSelectSql();
    const result = await this.executor(sql, this._bindings);
    return result.rows as T[];
  }

  async first<T = any>(): Promise<T | null> {
    this.limit(1);
    const results = await this.get<T>();
    return results.length > 0 ? results[0] : null;
  }

  async pluck<T = any>(field: string): Promise<T[]> {
    this.select(field);
    const results = await this.get<Record<string, T>>();
    return results.map((row) => row[field]);
  }

  async insert(data: Record<string, any> | Record<string, any>[]): Promise<any> {
    const records = Array.isArray(data) ? data : [data];

    if (records.length === 0) {
      throw new QueryError('Insert data cannot be empty');
    }

    const fields = Object.keys(records[0]);
    const placeholders = fields.map(() => '?').join(', ');
    const values: any[] = [];

    const valueRows = records
      .map((record) => {
        fields.forEach((field) => values.push(record[field]));
        return `(${placeholders})`;
      })
      .join(', ');

    const sql = `INSERT INTO ${this._from} (${fields.join(', ')}) VALUES ${valueRows}`;
    const result = await this.executor(sql, values);

    return result.rows[0];
  }

  async update(data: Record<string, any>): Promise<number> {
    const fields = Object.keys(data);
    const setClause = fields.map((field) => `${field} = ?`).join(', ');
    const values = fields.map((field) => data[field]);

    const sql = this.buildUpdateSql(setClause);
    const result = await this.executor(sql, [...values, ...this._bindings]);

    return result.rowCount;
  }

  async delete(): Promise<number> {
    const sql = this.buildDeleteSql();
    const result = await this.executor(sql, this._bindings);
    return result.rowCount;
  }

  async increment(field: string, amount: number = 1): Promise<number> {
    const sql = this.buildUpdateSql(`${field} = ${field} + ?`);
    const result = await this.executor(sql, [amount, ...this._bindings]);
    return result.rowCount;
  }

  async decrement(field: string, amount: number = 1): Promise<number> {
    const sql = this.buildUpdateSql(`${field} = ${field} - ?`);
    const result = await this.executor(sql, [amount, ...this._bindings]);
    return result.rowCount;
  }

  async raw(sql: string, bindings: any[] = []): Promise<QueryResult> {
    return this.executor(sql, bindings);
  }

  toSql(): string {
    return this.buildSelectSql();
  }

  getBindings(): any[] {
    return [...this._bindings];
  }

  // SQL building methods
  private buildSelectSql(): string {
    if (!this._from) {
      throw new QueryError('Table name is required');
    }

    let sql = `SELECT ${this._select.join(', ')} FROM ${this._from}`;

    if (this._joins.length > 0) {
      sql += ` ${this._joins.join(' ')}`;
    }

    const whereClause = this.buildWhereClause();
    if (whereClause) {
      sql += ` WHERE ${whereClause}`;
    }

    if (this._groupBy.length > 0) {
      sql += ` GROUP BY ${this._groupBy.join(', ')}`;
    }

    if (this._having.length > 0) {
      sql += ` HAVING ${this._having.join(' AND ')}`;
    }

    if (this._orderBy.length > 0) {
      sql += ` ORDER BY ${this._orderBy.join(', ')}`;
    }

    if (this._limitValue !== null) {
      sql += ` LIMIT ${this._limitValue}`;
    }

    if (this._offsetValue !== null) {
      sql += ` OFFSET ${this._offsetValue}`;
    }

    return sql;
  }

  private buildUpdateSql(setClause: string): string {
    if (!this._from) {
      throw new QueryError('Table name is required');
    }

    let sql = `UPDATE ${this._from} SET ${setClause}`;

    const whereClause = this.buildWhereClause();
    if (whereClause) {
      sql += ` WHERE ${whereClause}`;
    }

    return sql;
  }

  private buildDeleteSql(): string {
    if (!this._from) {
      throw new QueryError('Table name is required');
    }

    let sql = `DELETE FROM ${this._from}`;

    const whereClause = this.buildWhereClause();
    if (whereClause) {
      sql += ` WHERE ${whereClause}`;
    }

    return sql;
  }

  private buildWhereClause(): string {
    const conditions: string[] = [];

    if (this._where.length > 0) {
      conditions.push(this._where.join(' AND '));
    }

    if (this._orWhere.length > 0) {
      conditions.push(`(${this._orWhere.join(' OR ')})`);
    }

    return conditions.join(' AND ');
  }
}
