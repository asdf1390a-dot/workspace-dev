"""Send messages from Discord -> Telegram."""
from __future__ import annotations

import asyncio
import logging
from typing import Optional

from telegram import Bot
from telegram.error import TelegramError

log = logging.getLogger(__name__)


class TelegramSync:
    def __init__(self, token: str, ceo_chat_id: int) -> None:
        self.bot = Bot(token=token) if token else None
        self.ceo_chat_id = ceo_chat_id

    async def send(self, text: str, chat_id: Optional[int] = None):
        """Send to chat (defaults to CEO DM) with 1 retry @ 500ms."""
        if self.bot is None:
            raise RuntimeError("Telegram bot not configured")
        target = chat_id or self.ceo_chat_id
        if not target:
            raise RuntimeError("No telegram target chat configured")

        last_err: Optional[Exception] = None
        for attempt in range(2):
            try:
                return await self.bot.send_message(
                    chat_id=target, text=text, disable_web_page_preview=True
                )
            except TelegramError as e:
                last_err = e
                log.warning("Telegram send attempt %d failed: %s", attempt + 1, e)
                if attempt == 0:
                    await asyncio.sleep(0.5)
        assert last_err is not None
        raise last_err
