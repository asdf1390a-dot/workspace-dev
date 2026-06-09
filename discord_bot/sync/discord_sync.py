"""Send messages from Telegram -> Discord."""
from __future__ import annotations

import asyncio
import logging
from typing import Optional

import discord

log = logging.getLogger(__name__)


class DiscordSync:
    def __init__(self, bot: discord.Client) -> None:
        self.bot = bot

    async def send(
        self,
        channel_id: int,
        content: Optional[str] = None,
        embed: Optional[discord.Embed] = None,
    ) -> Optional[discord.Message]:
        if not channel_id:
            raise RuntimeError("Discord channel_id missing")

        channel = self.bot.get_channel(channel_id)
        if channel is None:
            try:
                channel = await self.bot.fetch_channel(channel_id)
            except discord.NotFound as e:
                raise RuntimeError(f"Discord channel {channel_id} not found") from e

        last_err: Optional[Exception] = None
        for attempt in range(2):
            try:
                return await channel.send(content=content, embed=embed)
            except (discord.HTTPException, discord.DiscordServerError) as e:
                last_err = e
                log.warning("Discord send attempt %d failed: %s", attempt + 1, e)
                if attempt == 0:
                    await asyncio.sleep(0.5)
        assert last_err is not None
        raise last_err
