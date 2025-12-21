import pyotp
import qrcode
import io
import base64
from typing import List, Tuple


class TwoFactorUtil:
    """Two-factor authentication utilities using TOTP"""

    @staticmethod
    def generate_secret() -> str:
        """Generate a new TOTP secret"""
        return pyotp.random_base32()

    @staticmethod
    def generate_qr_code(secret: str, email: str, issuer: str = "JAM Stack") -> str:
        """Generate QR code for authenticator app setup

        Returns:
            Base64 encoded QR code image
        """
        # Create provisioning URI
        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(name=email, issuer_name=issuer)

        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(uri)
        qr.make(fit=True)

        # Create image
        img = qr.make_image(fill_color="black", back_color="white")

        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        img_str = base64.b64encode(buffer.getvalue()).decode()

        return f"data:image/png;base64,{img_str}"

    @staticmethod
    def verify_token(secret: str, token: str) -> bool:
        """Verify a TOTP token

        Args:
            secret: The TOTP secret
            token: The 6-digit token to verify

        Returns:
            True if token is valid, False otherwise
        """
        try:
            totp = pyotp.TOTP(secret)
            # Allow for 2-step time window (60 seconds before/after)
            return totp.verify(token, valid_window=2)
        except:
            return False

    @staticmethod
    def generate_backup_codes(count: int = 8) -> List[str]:
        """Generate backup codes for 2FA recovery

        Args:
            count: Number of backup codes to generate

        Returns:
            List of alphanumeric backup codes
        """
        import secrets
        import string

        codes = []
        alphabet = string.ascii_uppercase + string.digits

        for _ in range(count):
            code = ''.join(secrets.choice(alphabet) for _ in range(8))
            # Format as XXXX-XXXX
            formatted = f"{code[:4]}-{code[4:]}"
            codes.append(formatted)

        return codes

    @staticmethod
    def get_current_token(secret: str) -> str:
        """Get current TOTP token (for testing)"""
        totp = pyotp.TOTP(secret)
        return totp.now()
