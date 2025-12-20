import bcrypt from 'bcrypt';
import { DatabaseAdapter } from '@jam/database-engine';
import { NotFoundError, ConflictError } from '@jam/base-app';

/**
 * User Model
 *
 * Handles user data operations
 */

export interface User {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  avatar_url: string | null;
  two_factor_enabled: boolean;
  two_factor_secret: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  display_name: string;
  avatar_url?: string;
}

export interface UpdateUserData {
  display_name?: string;
  avatar_url?: string;
}

export class UserModel {
  private db: DatabaseAdapter;
  private readonly tableName = 'profiles';

  constructor(db: DatabaseAdapter) {
    this.db = db;
  }

  /**
   * Hash a password
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserData): Promise<User> {
    // Check if user already exists
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await this.hashPassword(data.password);

    const result = await this.db.table(this.tableName).insert({
      email: data.email.toLowerCase(),
      password_hash: passwordHash,
      display_name: data.display_name,
      avatar_url: data.avatar_url || null,
      two_factor_enabled: false,
      two_factor_secret: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // PostgreSQL returns the inserted row, MySQL returns insertId
    if (result && result.id) {
      return this.findById(result.id);
    }

    // If we don't get an ID back, query by email
    const user = await this.findByEmail(data.email);
    if (!user) {
      throw new Error('Failed to create user');
    }

    return user;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const result = await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .first<User>();

    return result;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .table(this.tableName)
      .where('email', '=', email.toLowerCase())
      .first<User>();

    return result;
  }

  /**
   * Find user by ID or throw error
   */
  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }
    return user;
  }

  /**
   * Update user profile
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.display_name !== undefined) {
      updateData.display_name = data.display_name;
    }

    if (data.avatar_url !== undefined) {
      updateData.avatar_url = data.avatar_url;
    }

    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .update(updateData);

    return this.findByIdOrFail(id);
  }

  /**
   * Update password
   */
  async updatePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.findByIdOrFail(id);

    // Verify old password
    const isValid = await this.verifyPassword(oldPassword, user.password_hash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const newHash = await this.hashPassword(newPassword);

    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .update({
        password_hash: newHash,
        updated_at: new Date().toISOString(),
      });
  }

  /**
   * Enable 2FA
   */
  async enable2FA(id: string, secret: string): Promise<void> {
    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .update({
        two_factor_enabled: true,
        two_factor_secret: secret,
        updated_at: new Date().toISOString(),
      });
  }

  /**
   * Disable 2FA
   */
  async disable2FA(id: string): Promise<void> {
    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
        updated_at: new Date().toISOString(),
      });
  }

  /**
   * Delete user (soft delete by setting a flag or hard delete)
   */
  async delete(id: string): Promise<void> {
    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .delete();
  }

  /**
   * Get user without password hash (safe for API responses)
   */
  async getSafeUser(id: string): Promise<Omit<User, 'password_hash' | 'two_factor_secret'>> {
    const user = await this.findByIdOrFail(id);
    const { password_hash, two_factor_secret, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Convert user to safe format (remove sensitive fields)
   */
  toSafeUser(user: User): Omit<User, 'password_hash' | 'two_factor_secret'> {
    const { password_hash, two_factor_secret, ...safeUser } = user;
    return safeUser;
  }
}
