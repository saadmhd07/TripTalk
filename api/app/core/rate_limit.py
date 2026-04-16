from slowapi import Limiter
from slowapi.util import get_remote_address


def get_user_id_or_ip(request) -> str:
    """
    Get user ID from auth claims if available, otherwise fall back to IP.
    This ensures authenticated users are rate-limited by user, not by IP.
    """
    # Try to get user_id from request state (set by auth dependency)
    if hasattr(request.state, "user_id"):
        return f"user:{request.state.user_id}"

    # Fall back to IP address for unauthenticated requests
    return f"ip:{get_remote_address(request)}"


limiter = Limiter(key_func=get_user_id_or_ip)
