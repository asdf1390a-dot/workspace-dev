"""Discord Bot Phase 1 — main entry point.

Wires together:
  - discord.py client (on_ready, on_message, slash commands)
  - Telegram bridge (polling)
  - CTB poller (every CTB_POLL_INTERVAL_SEC)

Run:
    python bot.py
"""
from __future__ import annotations

import asyncio
import logging
import signal
from typing import Optional

import discord
from discord import app_commands
from supabase import Client, create_client

from config import cfg
from handlers.ctb_handler import CTBHandler
from handlers.error_handler import ErrorHandler
from handlers.message_handler import MessageHandler
from handlers.task_handler import TaskHandler
from sync.ctb_sync import CTBSync
from sync.discord_sync import DiscordSync
from sync.telegram_sync import TelegramSync
from telegram_bridge import TelegramBridge

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s :: %(message)s",
)
log = logging.getLogger("discord_bot")


def _build_supabase() -> Optional[Client]:
    if not (cfg.supabase_url and cfg.supabase_service_role_key):
        log.warning("Supabase not configured — running in offline mode")
        return None
    try:
        return create_client(cfg.supabase_url, cfg.supabase_service_role_key)
    except Exception as e:
        log.error("Supabase client init failed: %s", e)
        return None


class FMSBot(discord.Client):
    def __init__(self) -> None:
        intents = discord.Intents.default()
        intents.message_content = True
        intents.guild_messages = True
        intents.dm_messages = True
        super().__init__(intents=intents)

        self.tree = app_commands.CommandTree(self)
        self.supabase: Optional[Client] = _build_supabase()
        self.telegram_sync = TelegramSync(cfg.telegram_bot_token, cfg.telegram_ceo_chat_id)
        self.discord_sync = DiscordSync(self)
        self.error_handler = ErrorHandler(self.telegram_sync, self.supabase)
        self.message_handler = MessageHandler(
            self.telegram_sync, self.supabase, self.error_handler
        )
        self.task_handler = TaskHandler(self.supabase, self.telegram_sync)
        self.ctb_sync = CTBSync(self.discord_sync, self.telegram_sync)
        self.ctb_handler = CTBHandler(self.ctb_sync)
        self.telegram_bridge = TelegramBridge(
            self.discord_sync, self.supabase, self.error_handler
        )

        self.task_handler.register(self.tree)

    async def setup_hook(self) -> None:
        # Sync slash commands per guild if configured (faster than global)
        if cfg.discord_guild_id:
            guild = discord.Object(id=cfg.discord_guild_id)
            self.tree.copy_global_to(guild=guild)
            await self.tree.sync(guild=guild)
        else:
            await self.tree.sync()
        log.info("Slash commands synced")

        # Start Telegram bridge
        if self.telegram_bridge.build() is not None:
            await self.telegram_bridge.start()
            log.info("Telegram bridge running")

        # Start CTB poller
        self.ctb_handler.start()

    async def on_ready(self) -> None:
        log.info("Logged in as %s (id=%s)", self.user, self.user.id if self.user else "?")
        for g in self.guilds:
            log.info("  guild: %s (%d) — %d channels", g.name, g.id, len(g.channels))

    async def on_message(self, message: discord.Message) -> None:
        if message.content.strip().lower() == "!ping":
            await message.channel.send("pong")
            return
        await self.message_handler.handle_discord_message(message)

    async def close(self) -> None:
        log.info("Shutting down...")
        self.ctb_handler.stop()
        try:
            await self.telegram_bridge.stop()
        except Exception:
            pass
        await super().close()


async def _main() -> None:
    if not cfg.discord_bot_token:
        raise SystemExit("DISCORD_BOT_TOKEN is required")

    bot = FMSBot()

    loop = asyncio.get_running_loop()
    stop_event = asyncio.Event()

    def _signal(_sig, _frame=None):
        stop_event.set()

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, _signal)
        except NotImplementedError:
            pass

    async with bot:
        runner = asyncio.create_task(bot.start(cfg.discord_bot_token))
        await stop_event.wait()
        runner.cancel()


if __name__ == "__main__":
    try:
        asyncio.run(_main())
    except KeyboardInterrupt:
        pass
