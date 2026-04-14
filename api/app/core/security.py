from functools import lru_cache

import jwt
from jwt import InvalidTokenError, PyJWKClient

from app.core.config import settings


@lru_cache
def get_jwk_client() -> PyJWKClient:
    jwks_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(jwks_url)


def decode_supabase_token(token: str) -> dict:
    issuer = f"{settings.supabase_url.rstrip('/')}/auth/v1"

    try:
        signing_key = get_jwk_client().get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            issuer=issuer,
            options={"verify_aud": False},
        )
    except Exception:
        if settings.supabase_jwt_secret:
            try:
                return jwt.decode(
                    token,
                    settings.supabase_jwt_secret,
                    algorithms=["HS256"],
                    issuer=issuer,
                    options={"verify_aud": False},
                )
            except InvalidTokenError as exc:
                raise ValueError("Invalid Supabase token") from exc

        raise ValueError("Invalid Supabase token")
