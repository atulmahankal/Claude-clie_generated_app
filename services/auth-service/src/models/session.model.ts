import { DatabaseAdapter } from '@jam/database-engine';
import { NotFoundError } from '@jam/base-app';

/**
 * Session Model
 *
 * Handles user session management
 */

export interface Session {
  id: string;
  user_id: string;
  token: string;
  refresh_token: string;
  device_type: string | null;
  device_info: string | null;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: string;
  created_at: string;
  last_active: string;
}

export interface CreateSessionData {
  user_id: string;
  token: string;
  refresh_token: string;
  device_type?: string;
  device_info?: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: Date;
}

export class SessionModel {
  private db: DatabaseAdapter;
  private readonly tableName = 'active_sessions';

  constructor(db: DatabaseAdapter) {
    this.db = db;
  }

  /**
   * Create a new session
   */
  async create(data: CreateSessionData): Promise<Session> {
    const result = await this.db.table(this.tableName).insert({
      user_id: data.user_id,
      token: data.token,
      refresh_token: data.refresh_token,
      device_type: data.device_type || null,
      device_info: data.device_info || null,
      ip_address: data.ip_address || null,
      user_agent: data.user_agent || null,
      expires_at: data.expires_at.toISOString(),
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
    });

    if (result && result.id) {
      return this.findById(result.id);
    }

    // Fallback: query by token
    const session = await this.findByToken(data.token);
    if (!session) {
      throw new Error('Failed to create session');
    }

    return session;
  }

  /**
   * Find session by ID
   */
  async findById(id: string): Promise<Session | null> {
    const result = await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .first<Session>();

    return result;
  }

  /**
   * Find session by token
   */
  async findByToken(token: string): Promise<Session | null> {
    const result = await this.db
      .table(this.tableName)
      .where('token', '=', token)
      .where('expires_at', '>', new Date().toISOString())
      .first<Session>();

    return result;
  }

  /**
   * Find session by refresh token
   */
  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    const result = await this.db
      .table(this.tableName)
      .where('refresh_token', '=', refreshToken)
      .where('expires_at', '>', new Date().toISOString())
      .first<Session>();

    return result;
  }

  /**
   * Get all sessions for a user
   */
  async findByUserId(userId: string, includeExpired: boolean = false): Promise<Session[]> {
    let query = this.db
      .table(this.tableName)
      .where('user_id', '=', userId);

    if (!includeExpired) {
      query = query.where('expires_at', '>', new Date().toISOString());
    }

    const result = await query
      .orderBy('last_active', 'DESC')
      .get<Session>();

    return result;
  }

  /**
   * Update session last active timestamp
   */
  async updateLastActive(id: string): Promise<void> {
    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .update({
        last_active: new Date().toISOString(),
      });
  }

  /**
   * Update session token (for refresh)
   */
  async updateTokens(id: string, token: string, refreshToken: string, expiresAt: Date): Promise<void> {
    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .update({
        token,
        refresh_token: refreshToken,
        expires_at: expiresAt.toISOString(),
        last_active: new Date().toISOString(),
      });
  }

  /**
   * Revoke a specific session
   */
  async revoke(id: string): Promise<void> {
    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .delete();
  }

  /**
   * Revoke a session by token
   */
  async revokeByToken(token: string): Promise<void> {
    await this.db
      .table(this.tableName)
      .where('token', '=', token)
      .delete();
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .delete();
  }

  /**
   * Revoke all sessions except current
   */
  async revokeAllExcept(userId: string, currentSessionId: string): Promise<void> {
    await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .where('id', '!=', currentSessionId)
      .delete();
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.db
      .table(this.tableName)
      .where('expires_at', '<=', new Date().toISOString())
      .delete();

    return result;
  }

  /**
   * Validate session and update last active
   */
  async validateAndUpdate(token: string): Promise<Session | null> {
    const session = await this.findByToken(token);

    if (session) {
      await this.updateLastActive(session.id);
    }

    return session;
  }

  /**
   * Get session count for user
   */
  async getSessionCount(userId: string): Promise<number> {
    const result = await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .where('expires_at', '>', new Date().toISOString())
      .count();

    return result[0]?.count || 0;
  }
}
