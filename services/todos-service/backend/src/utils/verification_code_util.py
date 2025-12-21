import secrets


class VerificationCodeUtil:
    """Utilities for generating verification codes"""

    @staticmethod
    def generate_code(length: int = 6) -> str:
        """Generate a cryptographically secure numeric verification code

        Args:
            length: Length of the code (default: 6)

        Returns:
            String of numeric digits
        """
        # Generate random number between 0 and 10^length - 1
        max_value = 10 ** length
        code_number = secrets.randbelow(max_value)

        # Format with leading zeros
        code = str(code_number).zfill(length)

        return code

    @staticmethod
    def format_code(code: str) -> str:
        """Format code for display (e.g., '123456' -> '123 456')

        Args:
            code: The verification code

        Returns:
            Formatted code string
        """
        if len(code) == 6:
            return f"{code[:3]} {code[3:]}"
        return code

    @staticmethod
    def sanitize_code(code: str) -> str:
        """Remove non-digit characters from code

        Args:
            code: User-entered code that may contain spaces or dashes

        Returns:
            Sanitized numeric-only string
        """
        return ''.join(c for c in code if c.isdigit())
