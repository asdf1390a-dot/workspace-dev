"""Discord Bot Phase 1 — central configuration.

All secrets pulled from environment. Never commit a populated .env.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


def _int(name: str, default: int = 0) -> int:
    raw = os.getenv(name, "")
    try:
        return int(raw) if raw else default
    except ValueError:
        return default


@dataclass(frozen=True)
class Config:
    # Discord
    discord_bot_token: str = os.getenv("DISCORD_BOT_TOKEN", "")
    discord_public_key: str = os.getenv("DISCORD_PUBLIC_KEY", "")
    discord_guild_id: int = _int("DISCORD_GUILD_ID")

    # Discord channel IDs
    channel_announcements: int = _int("DISCORD_CHANNEL_ANNOUNCEMENTS")
    channel_inprogress: int = _int("DISCORD_CHANNEL_INPROGRESS")
    channel_completed: int = _int("DISCORD_CHANNEL_COMPLETED")
    channel_issues: int = _int("DISCORD_CHANNEL_ISSUES")
    channel_discussion: int = _int("DISCORD_CHANNEL_DISCUSSION")
    channel_secretary: int = _int("DISCORD_CHANNEL_SECRETARY")
    channel_translator: int = _int("DISCORD_CHANNEL_TRANSLATOR")
    channel_analyst: int = _int("DISCORD_CHANNEL_ANALYST")
    channel_developer: int = _int("DISCORD_CHANNEL_DEVELOPER")
    channel_planner: int = _int("DISCORD_CHANNEL_PLANNER")

    # Telegram
    telegram_bot_token: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    telegram_ceo_chat_id: int = _int("TELEGRAM_CEO_CHAT_ID")

    # Supabase
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # CTB
    ctb_poll_interval_sec: int = _int("CTB_POLL_INTERVAL_SEC", 300)
    ctb_state_file: str = os.getenv("CTB_STATE_FILE", "/tmp/ctb_last_state.json")
    ctb_source_file: str = os.getenv(
        "CTB_SOURCE_FILE",
        "/home/jeepney/.openclaw/workspace-dev/memory/active_work_tracking.md",
    )

    # Valid task assignees (kept simple for Phase 1)
    valid_assignees: tuple = (
        "웹개발자", "플레너", "평가자", "감시자", "CEO",
        "webdev", "planner", "evaluator", "auditor", "ceo",
    )


cfg = Config()

# Channel routing: incoming Discord channel IDs that should mirror to Telegram
SYNC_CHANNELS = {
    cfg.channel_secretary,
    cfg.channel_translator,
    cfg.channel_analyst,
    cfg.channel_developer,
    cfg.channel_planner,
    cfg.channel_discussion,
    cfg.channel_completed,
}

# CTB status -> Discord channel routing
CTB_CHANNEL_MAP = {
    "IN_PROGRESS": cfg.channel_inprogress,
    "COMPLETED": cfg.channel_completed,
    "BLOCKED": cfg.channel_issues,
}

# Embed colors per CTB status
STATUS_COLORS = {
    "IN_PROGRESS": 0xF59E0B,  # amber
    "COMPLETED": 0x22C55E,    # green
    "BLOCKED": 0xEF4444,      # red
    "PENDING": 0x94A3B8,      # gray
}
