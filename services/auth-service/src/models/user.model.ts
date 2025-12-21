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
  phone_number: string | null;
  bio: string | null;
  pending_email: string | null;
  email_verification_code: string | null;
  email_verification_expires_at: string | null;
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
  phone_number?: string;
  bio?: string;
  pending_email?: string;
  email_verification_code?: string;
  email_verification_expires_at?: string;
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

    if (data.phone_number !== undefined) {
      updateData.phone_number = data.phone_number;
    }

    if (data.bio !== undefined) {
      updateData.bio = data.bio;
    }

    if (data.pending_email !== undefined) {
      updateData.pending_email = data.pending_email;
    }

    if (data.email_verification_code !== undefined) {
      updateData.email_verification_code = data.email_verification_code;
    }

    if (data.email_verification_expires_at !== undefined) {
      updateData.email_verification_expires_at = data.email_verification_expires_at;
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

  /**
   * Reset password without old password verification
   * Used during password reset flow
   */
  async resetPassword(id: string, newPassword: string): Promise<void> {
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
   * Set pending email and verification code
   * Used when user wants to change their email
   */
  async setPendingEmail(
    id: string,
    newEmail: string,
    verificationCode: string,
    expiresAt: Date
  ): Promise<void> {
    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .update({
        pending_email: newEmail.toLowerCase(),
        email_verification_code: verificationCode,
        email_verification_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      });
  }

  /**
   * Complete pending email change
   * Moves pending_email to email and clears verification fields
   */
  async completePendingEmailChange(id: string): Promise<User> {
    const user = await this.findByIdOrFail(id);

    if (!user.pending_email) {
      throw new Error('No pending email change found');
    }

    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .update({
        email: user.pending_email,
        pending_email: null,
        email_verification_code: null,
        email_verification_expires_at: null,
        updated_at: new Date().toISOString(),
      });

    return this.findByIdOrFail(id);
  }

  /**
   * Clear pending email and verification code
   * Used when verification fails or expires
   */
  async clearPendingEmail(id: string): Promise<void> {
    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .update({
        pending_email: null,
        email_verification_code: null,
        email_verification_expires_at: null,
        updated_at: new Date().toISOString(),
      });
  }

  /**
   * Update email directly (admin function or verified change)
   */
  async updateEmail(id: string, newEmail: string): Promise<User> {
    // Check if email is already in use
    const existing = await this.findByEmail(newEmail);
    if (existing && existing.id !== id) {
      throw new ConflictError('Email already in use');
    }

    await this.db
      .table(this.tableName)
      .where('id', '=', id)
      .update({
        email: newEmail.toLowerCase(),
        updated_at: new Date().toISOString(),
      });

    return this.findByIdOrFail(id);
  }

  /**
   * Find user by pending email
   */
  async findByPendingEmail(email: string): Promise<User | null> {
    const result = await this.db
      .table(this.tableName)
      .where('pending_email', '=', email.toLowerCase())
      .first<User>();

    return result;
  }

  /**
   * Check if email is available (not used by any user)
   */
  async isEmailAvailable(email: string, excludeUserId?: string): Promise<boolean> {
    let query = this.db
      .table(this.tableName)
      .where('email', '=', email.toLowerCase());

    if (excludeUserId) {
      query = query.where('id', '!=', excludeUserId);
    }

    const result = await query.first();
    return !result;
  }
}
