import nodemailer, { Transporter } from 'nodemailer';
import { Logger } from '@jam/base-app';
import { VerificationCodeUtil } from './verification-code.util';

/**
 * Email Utility for Authentication Service
 *
 * Handles all email communications including:
 * - Password reset codes
 * - Email verification codes
 * - Security notifications
 *
 * Uses Mailpit SMTP for development/testing
 */
export class EmailUtil {
  private static transporter: Transporter | null = null;
  private static logger = Logger.getInstance();

  /**
   * Initialize email transporter with Mailpit SMTP settings
   */
  private static getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'mailpit',
        port: parseInt(process.env.SMTP_PORT || '1025'),
        secure: false, // Mailpit doesn't use TLS
        // No authentication required for Mailpit
      });

      this.logger.info('Email transporter initialized', {
        host: process.env.SMTP_HOST || 'mailpit',
        port: process.env.SMTP_PORT || '1025',
      });
    }

    return this.transporter;
  }

  /**
   * Get sender email configuration
   */
  private static getSenderInfo(): { from: string; fromName: string } {
    return {
      from: process.env.SMTP_FROM_EMAIL || 'noreply@jamstack.app',
      fromName: process.env.SMTP_FROM_NAME || 'JAM Stack App',
    };
  }

  /**
   * Send password reset email with 6-digit code and reset URL
   *
   * @param {string} email - Recipient email address
   * @param {string} code - 6-digit verification code
   * @param {string} resetUrl - Password reset page URL
   * @returns {Promise<boolean>} True if email sent successfully
   */
  static async sendPasswordResetEmail(
    email: string,
    code: string,
    resetUrl: string
  ): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      const { from, fromName } = this.getSenderInfo();
      const formattedCode = VerificationCodeUtil.formatForDisplay(code);

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid #4F46E5;
    }
    .content {
      padding: 30px 0;
    }
    .code-box {
      background-color: #F3F4F6;
      border: 2px dashed #4F46E5;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    .code {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 8px;
      color: #4F46E5;
      font-family: 'Courier New', monospace;
    }
    .button {
      display: inline-block;
      background-color: #4F46E5;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      font-size: 12px;
      color: #6B7280;
      text-align: center;
    }
    .warning {
      background-color: #FEF3C7;
      border-left: 4px solid #F59E0B;
      padding: 12px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔐 Password Reset Request</h1>
  </div>

  <div class="content">
    <p>Hello,</p>

    <p>We received a request to reset the password for your account. To proceed with the password reset, please use the verification code below:</p>

    <div class="code-box">
      <div class="code">${formattedCode}</div>
      <p style="margin-top: 10px; color: #6B7280;">This code will expire in 15 minutes</p>
    </div>

    <p style="text-align: center;">
      <strong>Or click the button below to reset your password:</strong>
    </p>

    <p style="text-align: center;">
      <a href="${resetUrl}${resetUrl.includes('?') ? '&' : '?'}code=${code}" class="button">Reset Password</a>
    </p>

    <div class="warning">
      <strong>⚠️ Security Notice:</strong>
      <ul style="margin: 8px 0 0 0; padding-left: 20px;">
        <li>This code can only be used once</li>
        <li>Maximum 3 verification attempts allowed</li>
        <li>If you didn't request this, please ignore this email</li>
        <li>Your password will remain unchanged unless you complete the reset process</li>
      </ul>
    </div>
  </div>

  <div class="footer">
    <p>This is an automated email from JAM Stack App. Please do not reply to this email.</p>
    <p>If you did not request a password reset, no action is needed. Your account is secure.</p>
  </div>
</body>
</html>
      `;

      const textContent = `
Password Reset Request

We received a request to reset the password for your account.

Your verification code is: ${formattedCode}

This code will expire in 15 minutes.

Alternatively, you can click this link to reset your password:
${resetUrl}${resetUrl.includes('?') ? '&' : '?'}code=${code}

Security Notice:
- This code can only be used once
- Maximum 3 verification attempts allowed
- If you didn't request this, please ignore this email
- Your password will remain unchanged unless you complete the reset process

This is an automated email from JAM Stack App.
If you did not request a password reset, no action is needed.
      `;

      await transporter.sendMail({
        from: `"${fromName}" <${from}>`,
        to: email,
        subject: 'Password Reset Code - JAM Stack App',
        text: textContent,
        html: htmlContent,
      });

      this.logger.info('Password reset email sent successfully', { email });
      return true;
    } catch (error: any) {
      this.logger.error('Failed to send password reset email', {
        email,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Send email verification code for profile email changes
   *
   * @param {string} email - New email address to verify
   * @param {string} code - 6-digit verification code
   * @param {string} userName - User's display name
   * @returns {Promise<boolean>} True if email sent successfully
   */
  static async sendEmailVerificationCode(
    email: string,
    code: string,
    userName: string
  ): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      const { from, fromName } = this.getSenderInfo();
      const formattedCode = VerificationCodeUtil.formatForDisplay(code);

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid #10B981;
    }
    .content {
      padding: 30px 0;
    }
    .code-box {
      background-color: #F3F4F6;
      border: 2px dashed #10B981;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    .code {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 8px;
      color: #10B981;
      font-family: 'Courier New', monospace;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      font-size: 12px;
      color: #6B7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>✉️ Verify Your Email Address</h1>
  </div>

  <div class="content">
    <p>Hello ${userName},</p>

    <p>You've requested to change your email address. To complete this change, please verify your new email address using the code below:</p>

    <div class="code-box">
      <div class="code">${formattedCode}</div>
      <p style="margin-top: 10px; color: #6B7280;">This code will expire in 15 minutes</p>
    </div>

    <p><strong>What happens next?</strong></p>
    <ul>
      <li>Enter this code in your profile settings</li>
      <li>Your email address will be updated immediately</li>
      <li>You'll receive all future notifications at this new address</li>
    </ul>

    <p style="color: #DC2626;"><strong>Didn't request this change?</strong> If you didn't attempt to change your email address, please ignore this message and contact support immediately.</p>
  </div>

  <div class="footer">
    <p>This is an automated email from JAM Stack App. Please do not reply to this email.</p>
  </div>
</body>
</html>
      `;

      const textContent = `
Verify Your Email Address

Hello ${userName},

You've requested to change your email address. To complete this change, please verify your new email address using the code below:

Your verification code is: ${formattedCode}

This code will expire in 15 minutes.

What happens next?
- Enter this code in your profile settings
- Your email address will be updated immediately
- You'll receive all future notifications at this new address

Didn't request this change? If you didn't attempt to change your email address, please ignore this message and contact support immediately.

This is an automated email from JAM Stack App.
      `;

      await transporter.sendMail({
        from: `"${fromName}" <${from}>`,
        to: email,
        subject: 'Verify Your New Email Address - JAM Stack App',
        text: textContent,
        html: htmlContent,
      });

      this.logger.info('Email verification code sent successfully', { email });
      return true;
    } catch (error: any) {
      this.logger.error('Failed to send email verification code', {
        email,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Send notification email when password is successfully changed
   *
   * @param {string} email - User's email address
   * @returns {Promise<boolean>} True if email sent successfully
   */
  static async sendPasswordChangedNotification(email: string): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      const { from, fromName } = this.getSenderInfo();

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid #10B981;
    }
    .content {
      padding: 30px 0;
    }
    .success-box {
      background-color: #D1FAE5;
      border-left: 4px solid #10B981;
      padding: 15px;
      margin: 20px 0;
    }
    .warning {
      background-color: #FEF3C7;
      border-left: 4px solid #F59E0B;
      padding: 12px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      font-size: 12px;
      color: #6B7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Password Successfully Changed</h1>
  </div>

  <div class="content">
    <div class="success-box">
      <p style="margin: 0;"><strong>Your password has been successfully changed.</strong></p>
    </div>

    <p>This email confirms that your password was changed on ${new Date().toLocaleString()}.</p>

    <p><strong>What this means:</strong></p>
    <ul>
      <li>Your account is now secured with your new password</li>
      <li>All other active sessions have been logged out for security</li>
      <li>You may need to log in again on your other devices</li>
    </ul>

    <div class="warning">
      <p style="margin: 0;"><strong>⚠️ Didn't make this change?</strong></p>
      <p style="margin: 8px 0 0 0;">If you didn't change your password, your account may have been compromised. Please contact support immediately and secure your account.</p>
    </div>
  </div>

  <div class="footer">
    <p>This is an automated security notification from JAM Stack App.</p>
    <p>For your security, we recommend using a strong, unique password.</p>
  </div>
</body>
</html>
      `;

      const textContent = `
Password Successfully Changed

Your password has been successfully changed on ${new Date().toLocaleString()}.

What this means:
- Your account is now secured with your new password
- All other active sessions have been logged out for security
- You may need to log in again on your other devices

Didn't make this change?
If you didn't change your password, your account may have been compromised. Please contact support immediately and secure your account.

This is an automated security notification from JAM Stack App.
For your security, we recommend using a strong, unique password.
      `;

      await transporter.sendMail({
        from: `"${fromName}" <${from}>`,
        to: email,
        subject: 'Password Changed - Security Alert',
        text: textContent,
        html: htmlContent,
      });

      this.logger.info('Password changed notification sent successfully', { email });
      return true;
    } catch (error: any) {
      this.logger.error('Failed to send password changed notification', {
        email,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Send notification when all sessions are revoked (password reset scenario)
   *
   * @param {string} email - User's email address
   * @returns {Promise<boolean>} True if email sent successfully
   */
  static async sendAllSessionsRevokedNotification(email: string): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      const { from, fromName } = this.getSenderInfo();

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid #DC2626;
    }
    .content {
      padding: 30px 0;
    }
    .alert-box {
      background-color: #FEE2E2;
      border-left: 4px solid #DC2626;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      font-size: 12px;
      color: #6B7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔒 Password Reset Completed</h1>
  </div>

  <div class="content">
    <div class="alert-box">
      <p style="margin: 0;"><strong>Security Alert: All Sessions Logged Out</strong></p>
    </div>

    <p>Your password has been successfully reset on ${new Date().toLocaleString()}.</p>

    <p><strong>For your security, we have logged you out of all devices.</strong> This includes:</p>
    <ul>
      <li>Web browsers</li>
      <li>Mobile apps</li>
      <li>Any other logged-in sessions</li>
    </ul>

    <p>You can now log in with your new password on any device.</p>

    <p style="color: #DC2626;"><strong>Didn't reset your password?</strong> If you didn't request this password reset, your account may be compromised. Please contact support immediately.</p>
  </div>

  <div class="footer">
    <p>This is an automated security notification from JAM Stack App.</p>
  </div>
</body>
</html>
      `;

      const textContent = `
Password Reset Completed

Security Alert: All Sessions Logged Out

Your password has been successfully reset on ${new Date().toLocaleString()}.

For your security, we have logged you out of all devices. This includes:
- Web browsers
- Mobile apps
- Any other logged-in sessions

You can now log in with your new password on any device.

Didn't reset your password? If you didn't request this password reset, your account may be compromised. Please contact support immediately.

This is an automated security notification from JAM Stack App.
      `;

      await transporter.sendMail({
        from: `"${fromName}" <${from}>`,
        to: email,
        subject: 'Password Reset Completed - All Sessions Logged Out',
        text: textContent,
        html: htmlContent,
      });

      this.logger.info('All sessions revoked notification sent successfully', { email });
      return true;
    } catch (error: any) {
      this.logger.error('Failed to send all sessions revoked notification', {
        email,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Test email configuration by sending a test email
   *
   * @param {string} recipientEmail - Email to send test to
   * @returns {Promise<boolean>} True if test email sent successfully
   */
  static async sendTestEmail(recipientEmail: string): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      const { from, fromName } = this.getSenderInfo();

      await transporter.sendMail({
        from: `"${fromName}" <${from}>`,
        to: recipientEmail,
        subject: 'Test Email - JAM Stack App',
        text: 'This is a test email from JAM Stack App authentication service.',
        html: '<p>This is a test email from <strong>JAM Stack App</strong> authentication service.</p>',
      });

      this.logger.info('Test email sent successfully', { recipientEmail });
      return true;
    } catch (error: any) {
      this.logger.error('Failed to send test email', {
        recipientEmail,
        error: error.message,
      });
      return false;
    }
  }
}

export default EmailUtil;
