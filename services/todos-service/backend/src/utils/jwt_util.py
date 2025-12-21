from datetime import datetime, timedelta
from typing import Dict, Optional
from jose import JWTError, jwt
from ..config import settings


class JWTUtil:
    """JWT token generation and validation"""

    @staticmethod
    def create_access_token(user_id: str, email: str) -> str:
        """Create access token"""
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        expire = datetime.utcnow() + expires_delta

        to_encode = {
            "sub": user_id,
            "email": email,
            "type": "access",
            "iss": "jam-auth-service",
            "aud": "jam-app",
            "exp": expire,
            "iat": datetime.utcnow(),
        }

        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET,
            algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt

    @staticmethod
    def create_refresh_token(user_id: str, email: str) -> str:
        """Create refresh token"""
        expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        expire = datetime.utcnow() + expires_delta

        to_encode = {
            "sub": user_id,
            "email": email,
            "type": "refresh",
            "iss": "jam-auth-service",
            "aud": "jam-app",
            "exp": expire,
            "iat": datetime.utcnow(),
        }

        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_REFRESH_SECRET,
            algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt

    @staticmethod
    def create_reset_token(user_id: str, email: str) -> str:
        """Create password reset token"""
        expires_delta = timedelta(minutes=15)
        expire = datetime.utcnow() + expires_delta

        to_encode = {
            "sub": user_id,
            "email": email,
            "type": "reset",
            "iss": "jam-auth-service",
            "aud": "jam-app",
            "exp": expire,
            "iat": datetime.utcnow(),
        }

        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET,
            algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt

    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> Optional[Dict]:
        """Verify and decode token"""
        try:
            secret = settings.JWT_REFRESH_SECRET if token_type == "refresh" else settings.JWT_SECRET

            payload = jwt.decode(
                token,
                secret,
                algorithms=[settings.JWT_ALGORITHM],
                issuer="jam-auth-service",
                audience="jam-app"
            )

            if payload.get("type") != token_type:
                return None

            return payload
        except JWTError:
            return None

    @staticmethod
    def get_token_expiry(token: str) -> Optional[datetime]:
        """Get token expiration time"""
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM],
                options={"verify_signature": False}
            )
            exp = payload.get("exp")
            if exp:
                return datetime.fromtimestamp(exp)
            return None
        except JWTError:
            return None
