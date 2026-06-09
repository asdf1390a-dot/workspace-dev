"""Telegram -> Discord bridge.

Runs a polling listener for Telegram messages. CEO messages go to
#announcements; messages matching `/task @assign ...` are routed to the
task pipeline.
"""
from __future__ import annotations

import asyncio
import logging
import re
from datetime import datetime, timezone
from typing import Optional

from telegram import Update
from telegram.ext import (
    Application,
    ApplicationBuilder,
    MessageHandler as TgMessageHandler,
    ContextTypes,
    filters,
)
from supabase import Client

from config import cfg
from sync import conflict_resolver
from sync.discord_sync import DiscordSync
from handlers.error_handler import ErrorHandler

log = logging.getLogger(__name__)

TASK_CMD = re.compile(r"^/task\s+@(\S+)\s+(.+)$", re.IGNORECASE | re.DOTALL)


class TelegramBridge:
    def __init__(
        self,
        discord_sync: DiscordSync,
        supabase: Optional[Client],
        error_handler: ErrorHandler,
    ) -> None:
        self.discord_sync = discord_sync
        self.supabase = supabase
        self.error_handler = error_handler
        self.app: Optional[Application] = None

    def build(self) -> Optional[Application]:
        if not cfg.telegram_bot_token:
            log.warning("Telegram bot token missing — bridge disabled")
            return None
        self.app = ApplicationBuilder().token(cfg.telegram_bot_token).build()
        self.app.add_handler(
            TgMessageHandler(filters.TEXT & ~filters.COMMAND, self._on_message)
        )
        self.app.add_handler(
            TgMessageHandler(filters.COMMAND, self._on_command)
        )
        return self.app

    async def start(self) -> None:
        if self.app is None:
            return
        await self.app.initialize()
        await self.app.start()
        if self.app.updater:
            await self.app.updater.start_polling(drop_pending_updates=True)

    async def stop(self) -> None:
        if self.app is None:
            return
        if self.app.updater and self.app.updater.running:
            await self.app.updater.stop()
        await self.app.stop()
        await self.app.shutdown()

    # ---- handlers ----
    async def _on_message(self, update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
        msg = update.effective_message
        if msg is None or msg.from_user is None:
            return
        # Only mirror CEO messages
        if cfg.telegram_ceo_chat_id and msg.chat_id != cfg.telegram_ceo_chat_id:
            return

        text = msg.text or ""
        chash = conflict_resolver.hash_content(msg.message_id, text)
        if await conflict_resolver.exists(self.supabase, chash):
            await self._log(
                source_platform="telegram",
                source_msg_id=msg.message_id,
                target_platform="discord",
                content_hash=chash,
                sync_status="duplicate",
            )
            return

        try:
            sent = await self.discord_sync.send(
                channel_id=cfg.channel_announcements,
                content=f"**[Telegram CEO]** {msg.from_user.full_name}:\n{text}",
            )
            conflict_resolver.remember(chash)
            await self._log(
                source_platform="telegram",
                source_msg_id=msg.message_id,
                target_platform="discord",
                target_msg_id=getattr(sent, "id", None),
                content_hash=chash,
                sync_status="success",
            )
        except Exception as e:
            await self._log(
                source_platform="telegram",
                source_msg_id=msg.message_id,
                target_platform="discord",
                content_hash=chash,
                sync_status="fallback",
                error_msg=str(e),
            )
            await self.error_handler.alert(e, context=f"tg_msg_id={msg.message_id}")

    async def _on_command(self, update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
        msg = update.effective_message
        if msg is None or not msg.text:
            return
        m = TASK_CMD.match(msg.text.strip())
        if not m:
            return
        assignee, description = m.group(1).strip(), m.group(2).strip()

        if assignee not in cfg.valid_assignees:
            await msg.reply_text(
                f"❌ 잘못된 담당자: {assignee}\n유효 멤버: {', '.join(cfg.valid_assignees)}"
            )
            return
        if not (5 <= len(description) <= 500):
            await msg.reply_text("❌ 작업 설명은 5~500자 사이여야 합니다.")
            return

        if self.supabase is not None:
            try:
                self.supabase.table("discord_task_queue").insert(
                    {
                        "assigned_to": assignee,
                        "task_description": description,
                        "priority": "P1",
                        "platform_origin": "telegram",
                        "status": "pending",
                    }
                ).execute()
            except Exception as e:
                log.error("tg task insert failed: %s", e)

        try:
            import discord as _d  # local import to avoid top-level cost

            embed = _d.Embed(
                title="📋 새 작업 (from Telegram)",
                description=description,
                color=0x3B82F6,
                timestamp=datetime.now(timezone.utc),
            )
            embed.add_field(name="담당자", value=assignee, inline=True)
            embed.add_field(name="출처", value="Telegram CEO", inline=True)
            await self.discord_sync.send(channel_id=cfg.channel_inprogress, embed=embed)
            await msg.reply_text(f"✅ 작업 등록: @{assignee} — {description[:80]}")
        except Exception as e:
            await self.error_handler.alert(e, context="tg /task -> discord")

    async def _log(self, **fields) -> None:
        if self.supabase is None:
            return
        try:
            row = {**fields, "synced_at": datetime.now(timezone.utc).isoformat()}
            self.supabase.table("discord_sync_log").insert(row).execute()
        except Exception as e:
            log.warning("sync_log insert failed: %s", e)
