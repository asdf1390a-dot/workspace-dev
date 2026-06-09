"""Environment-backed settings."""
from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:  # pragma: no cover
    pass


@dataclass(frozen=True)
class Settings:
    """Runtime settings loaded from environment variables."""

    DISCORD_TOKEN: Optional[str]
    API_BASE_URL: str
    SUPABASE_URL: Optional[str]
    SUPABASE_SERVICE_ROLE_KEY: Optional[str]
    LOG_LEVEL: str

    @classmethod
    def load(cls) -> "Settings":
        return cls(
            DISCORD_TOKEN=os.getenv("DISCORD_TOKEN"),
            API_BASE_URL=os.getenv(
                "API_BASE_URL", "https://dsc-fms-portal.vercel.app"
            ).rstrip("/"),
            SUPABASE_URL=os.getenv("SUPABASE_URL"),
            SUPABASE_SERVICE_ROLE_KEY=os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
            LOG_LEVEL=os.getenv("LOG_LEVEL", "INFO").upper(),
        )

    def require_discord_token(self) -> str:
        if not self.DISCORD_TOKEN:
            raise RuntimeError("DISCORD_TOKEN not set in environment.")
        return self.DISCORD_TOKEN
