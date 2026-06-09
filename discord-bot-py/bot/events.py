"""Event handlers: on_ready, on_message.

Routes inbound messages to the correct processor via `processors.router` and
replies with the resulting Discord embed.
"""
from __future__ import annotations

from typing import Optional

import discord

from bot.embed import build_embed, build_error_embed
from processors import PROCESSOR_REGISTRY
from processors.base import BaseProcessor, ProcessorError
from processors.router import detect_processor
from utils.logger import get_logger

logger = get_logger(__name__)


def register_events(client: discord.Client) -> None:
    """Attach on_ready / on_message handlers to the client."""

    @client.event
    async def on_ready() -> None:  # pragma: no cover - requires live gateway
        user = client.user
        if user is not None:
            logger.info("Bot logged in as %s (id=%s)", user.name, user.id)
        try:
            await client.change_presence(
                activity=discord.Game(name="Team Automation | mention me")
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to set presence: %s", exc)

    @client.event
    async def on_message(message: discord.Message) -> None:
        await handle_message(client, message)


async def handle_message(
    client: discord.Client, message: discord.Message
) -> Optional[str]:
    """Handle a single inbound message. Returns processor name routed, or None."""
    # Skip messages from ourselves to avoid loops.
    if client.user is not None and message.author.id == client.user.id:
        return None
    # Skip other bots by default.
    if getattr(message.author, "bot", False):
        return None

    processor_name = detect_processor(message.content or "")
    if processor_name is None:
        logger.debug(
            "No processor matched for message %s: %r",
            getattr(message, "id", "?"),
            (message.content or "")[:80],
        )
        return None

    logger.info(
        "Routing message %s to processor=%s by user=%s",
        getattr(message, "id", "?"),
        processor_name,
        getattr(message.author, "display_name", "?"),
    )

    processor_cls = PROCESSOR_REGISTRY[processor_name]
    processor: BaseProcessor = processor_cls()

    try:
        data = await processor.call(
            message_id=str(message.id),
            channel_id=str(message.channel.id),
            user_id=str(message.author.id),
            username=getattr(message.author, "display_name", str(message.author)),
            content=message.content or "",
            timestamp=message.created_at.isoformat() if message.created_at else "",
        )
        embed = build_embed(data.get("embed") or {})
        await message.reply(embed=embed, mention_author=False)
        logger.info("Processor %s responded OK for msg %s", processor_name, message.id)
        return processor_name

    except ProcessorError as exc:
        logger.error("Processor %s logical error: %s", processor_name, exc)
        await message.reply(
            embed=build_error_embed(str(exc)), mention_author=False
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Processor %s failed: %s", processor_name, exc)
        await message.reply(
            embed=build_error_embed(
                "데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요."
            ),
            mention_author=False,
        )
    return processor_name
