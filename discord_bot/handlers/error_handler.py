"""Centralized error fallback: log + DM CEO via Telegram."""
from __future__ import annotations

import logging
from typing import Optional

from supabase import Client

from sync.telegram_sync import TelegramSync

log = logging.getLogger(__name__)


class ErrorHandler:
    def __init__(self, telegram_sync: TelegramSync, supabase: Optional[Client]) -> None:
        self.telegram_sync = telegram_sync
        self.supabase = supabase

    async def alert(self, err: Exception, context: str = "") -> None:
        msg = f"⚠️ Discord Bot 동기화 오류\n컨텍스트: {context or '-'}\n원인: {err}"
        log.error("alert: %s", msg)
        try:
            await self.telegram_sync.send(msg)
        except Exception as inner:
            log.error("Telegram fallback also failed: %s", inner)

        if self.supabase is not None:
            try:
                self.supabase.table("discord_notifications").insert(
                    {
                        "notify_type": "sync_error",
                        "content": str(err)[:1000],
                        "platform": "telegram",
                    }
                ).execute()
            except Exception:
                pass
