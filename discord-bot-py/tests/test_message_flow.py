"""Test 5: end-to-end on_message handler routes & replies with embed."""
from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import discord
import pytest

from bot.events import handle_message
from processors.base import BaseProcessor


SAMPLE_OK = {
    "success": True,
    "embed": {
        "title": "📅 주간 일정 현황",
        "description": "...",
        "color": 0x3498DB,
        "fields": [],
        "footer": {"text": "Secretary"},
        "timestamp": "2026-06-09T10:00:00Z",
    },
}


def _make_message(content: str, *, author_id: int = 999, bot: bool = False):
    """Build a minimal discord.Message-like stub."""
    reply_mock = AsyncMock()
    author = SimpleNamespace(
        id=author_id, display_name="tester", bot=bot, __str__=lambda self: "tester"
    )
    channel = SimpleNamespace(id=42)
    return SimpleNamespace(
        id=1234,
        content=content,
        author=author,
        channel=channel,
        created_at=datetime.now(timezone.utc),
        reply=reply_mock,
    )


def _make_client(user_id: int = 1):
    user = SimpleNamespace(id=user_id, name="bot")
    return SimpleNamespace(user=user)


@pytest.mark.asyncio
async def test_handle_message_routes_and_replies():
    msg = _make_message("일정 알려줘")
    client = _make_client()

    async def fake_post(self, payload):
        return SAMPLE_OK

    with patch.object(BaseProcessor, "_post", fake_post):
        result = await handle_message(client, msg)

    assert result == "secretary"
    msg.reply.assert_awaited_once()
    kwargs = msg.reply.await_args.kwargs
    assert "embed" in kwargs
    assert isinstance(kwargs["embed"], discord.Embed)
    assert kwargs["embed"].title.startswith("📅")


@pytest.mark.asyncio
async def test_handle_message_no_match_no_reply():
    msg = _make_message("just saying hi")
    client = _make_client()
    result = await handle_message(client, msg)
    assert result is None
    msg.reply.assert_not_awaited()


@pytest.mark.asyncio
async def test_handle_message_skips_bot_author():
    msg = _make_message("일정", bot=True)
    client = _make_client()
    result = await handle_message(client, msg)
    assert result is None
    msg.reply.assert_not_awaited()
