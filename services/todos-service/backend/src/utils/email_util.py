import aiosmtplib
from email.message import EmailMessage
from ..config import settings


class EmailUtil:
    """Email sending utilities"""

    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str = None
    ) -> bool:
        """Send an email

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email body
            text_content: Plain text email body (optional)

        Returns:
            True if sent successfully, False otherwise
        """
        try:
            message = EmailMessage()
            message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            message["To"] = to_email
            message["Subject"] = subject

            # Set content
            if text_content:
                message.set_content(text_content)
                message.add_alternative(html_content, subtype="html")
            else:
                message.set_content(html_content, subtype="html")

            # Send email
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                use_tls=settings.SMTP_USE_TLS,
            )

            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False

    @staticmethod
    async def send_password_reset_email(to_email: str, code: str) -> bool:
        """Send password reset email with code

        Args:
            to_email: Recipient email address
            code: 6-digit verification code

        Returns:
            True if sent successfully
        """
        from .verification_code_util import VerificationCodeUtil

        formatted_code = VerificationCodeUtil.format_code(code)

        subject = "Password Reset Request"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #3b82f6; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9fafb; }}
                .code-box {{
                    background-color: #fff;
                    border: 2px solid #3b82f6;
                    padding: 20px;
                    text-align: center;
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 4px;
                    margin: 20px 0;
                }}
                .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>We received a request to reset your password. Use the code below to complete the process:</p>
                    <div class="code-box">{formatted_code}</div>
                    <p>This code will expire in 15 minutes.</p>
                    <p>If you didn't request a password reset, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>© 2025 JAM Stack Application. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        Password Reset Request

        We received a request to reset your password.

        Your verification code is: {formatted_code}

        This code will expire in 15 minutes.

        If you didn't request a password reset, please ignore this email.
        """

        return await EmailUtil.send_email(to_email, subject, html_content, text_content)

    @staticmethod
    async def send_email_verification(to_email: str, code: str) -> bool:
        """Send email verification code

        Args:
            to_email: Recipient email address
            code: 6-digit verification code

        Returns:
            True if sent successfully
        """
        from .verification_code_util import VerificationCodeUtil

        formatted_code = VerificationCodeUtil.format_code(code)

        subject = "Verify Your Email Address"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #10b981; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9fafb; }}
                .code-box {{
                    background-color: #fff;
                    border: 2px solid #10b981;
                    padding: 20px;
                    text-align: center;
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 4px;
                    margin: 20px 0;
                }}
                .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Verify Your Email</h1>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>Please verify your email address using the code below:</p>
                    <div class="code-box">{formatted_code}</div>
                    <p>This code will expire in 15 minutes.</p>
                </div>
                <div class="footer">
                    <p>© 2025 JAM Stack Application. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        return await EmailUtil.send_email(to_email, subject, html_content)
