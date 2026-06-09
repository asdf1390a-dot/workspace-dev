"""Discord -> Telegram message sync."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

import discord
from supabase import Client

from config import SYNC_CHANNELS
from sync import conflict_resolver
from sync.telegram_sync import TelegramSync
from handlers.error_handler import ErrorHandler

log = logging.getLogger(__name__)


class MessageHandler:
    def __init__(
        self,
        telegram_sync: TelegramSync,
        supabase: Optional[Client],
        error_handler: ErrorHandler,
    ) -> None:
        self.telegram_sync = telegram_sync
        self.supabase = supabase
        self.error_handler = error_handler

    async def handle_discord_message(self, message: discord.Message) -> None:
        if message.author.bot:
            return
        if message.channel.id not in SYNC_CHANNELS:
            return
        if not (message.content or "").strip():
            return

        chash = conflict_resolver.hash_content(message.id, message.content)

        if await conflict_resolver.exists(self.supabase, chash):
            await self._log(
                source_platform="discord",
                source_msg_id=message.id,
                target_platform="telegram",
                content_hash=chash,
                sync_status="duplicate",
            )
            return

        channel_name = getattr(message.channel, "name", str(message.channel.id))
        tg_text = (
            f"[Discord #{channel_name}] {message.author.display_name}:\n"
            f"{message.content}"
        )

        try:
            tg_msg = await self.telegram_sync.send(tg_text)
            conflict_resolver.remember(chash)
            await self._log(
                source_platform="discord",
                source_msg_id=message.id,
                target_platform="telegram",
                target_msg_id=getattr(tg_msg, "message_id", None),
                content_hash=chash,
                sync_status="success",
            )
            await self._archive_message(message, telegram_msg_id=getattr(tg_msg, "message_id", None))
        except Exception as e:
            await self._log(
                source_platform="discord",
                source_msg_id=message.id,
                target_platform="telegram",
                content_hash=chash,
                sync_status="error",
                error_msg=str(e),
            )
            await self.error_handler.alert(e, context=f"discord_msg_id={message.id}")

    # ---- internals ----
    async def _log(self, **fields) -> None:
        if self.supabase is None:
            return
        try:
            row = {**fields, "synced_at": datetime.now(timezone.utc).isoformat()}
            self.supabase.table("discord_sync_log").insert(row).execute()
        except Exception as e:
            log.warning("sync_log insert failed: %s", e)

    async def _archive_message(self, message: discord.Message, telegram_msg_id: Optional[int]) -> None:
        if self.supabase is None:
            return
        try:
            self.supabase.table("discord_messages").upsert(
                {
                    "discord_msg_id": message.id,
                    "user_id": message.author.id,
                    "user_name": message.author.display_name,
                    "channel_id": message.channel.id,
                    "channel_name": getattr(message.channel, "name", None),
                    "content": message.content,
                    "is_command": (message.content or "").startswith("/"),
                    "synced_to_telegram": telegram_msg_id is not None,
                    "telegram_msg_id": telegram_msg_id,
                },
                on_conflict="discord_msg_id",
            ).execute()
        except Exception as e:
            log.warning("discord_messages upsert failed: %s", e)
