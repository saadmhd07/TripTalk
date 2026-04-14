import httpx

from app.core.config import settings


class SupabaseClient:
    def __init__(self) -> None:
        self.base_url = settings.supabase_url.rstrip("/")
        self.anon_key = settings.supabase_anon_key

    async def get(self, path: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/{path.lstrip('/')}",
                headers={"apikey": self.anon_key, "Authorization": f"Bearer {self.anon_key}"},
            )
            response.raise_for_status()
            return response.json()
