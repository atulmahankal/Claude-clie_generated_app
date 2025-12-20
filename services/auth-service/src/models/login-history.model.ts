import { DatabaseAdapter } from '@jam/database-engine';

/**
 * Login History Model
 *
 * Tracks user login attempts and history
 */

export interface LoginHistory {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  device_info: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

export interface CreateLoginHistoryData {
  user_id: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: string;
  success: boolean;
  failure_reason?: string;
}

export class LoginHistoryModel {
  private db: DatabaseAdapter;
  private readonly tableName = 'login_history';

  constructor(db: DatabaseAdapter) {
    this.db = db;
  }

  /**
   * Record a login attempt
   */
  async create(data: CreateLoginHistoryData): Promise<void> {
    await this.db.table(this.tableName).insert({
      user_id: data.user_id,
      ip_address: data.ip_address || null,
      user_agent: data.user_agent || null,
      device_info: data.device_info || null,
      success: data.success,
      failure_reason: data.failure_reason || null,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Get login history for a user
   */
  async findByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<LoginHistory[]> {
    const result = await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .orderBy('created_at', 'DESC')
      .limit(limit)
      .offset(offset)
      .get<LoginHistory>();

    return result;
  }

  /**
   * Get recent failed login attempts
   */
  async getRecentFailedAttempts(
    userId: string,
    minutesAgo: number = 15
  ): Promise<number> {
    const since = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();

    const result = await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .where('success', '=', false)
      .where('created_at', '>=', since)
      .count();

    return result[0]?.count || 0;
  }

  /**
   * Get last successful login
   */
  async getLastSuccessfulLogin(userId: string): Promise<LoginHistory | null> {
    const result = await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .where('success', '=', true)
      .orderBy('created_at', 'DESC')
      .limit(1)
      .first<LoginHistory>();

    return result;
  }

  /**
   * Check for suspicious activity (multiple failed logins from different IPs)
   */
  async checkSuspiciousActivity(
    userId: string,
    hoursAgo: number = 24
  ): Promise<{
    failedAttempts: number;
    uniqueIPs: number;
    suspicious: boolean;
  }> {
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

    const failedAttempts = await this.db
      .table(this.tableName)
      .where('user_id', '=', userId)
      .where('success', '=', false)
      .where('created_at', '>=', since)
      .get<LoginHistory>();

    const uniqueIPs = new Set(
      failedAttempts
        .filter((attempt) => attempt.ip_address)
        .map((attempt) => attempt.ip_address)
    ).size;

    const suspicious = failedAttempts.length >= 5 || uniqueIPs >= 3;

    return {
      failedAttempts: failedAttempts.length,
      uniqueIPs,
      suspicious,
    };
  }

  /**
   * Delete old login history (cleanup)
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const result = await this.db
      .table(this.tableName)
      .where('created_at', '<', cutoffDate)
      .delete();

    return result;
  }
}
