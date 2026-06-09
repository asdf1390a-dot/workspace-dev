"""Test 4: embed builder converts payload to discord.Embed."""
from __future__ import annotations

import discord

from bot.embed import build_embed, build_error_embed


def test_build_embed_full():
    data = {
        "title": "📅 일정",
        "description": "이번 주",
        "color": 0x3498DB,
        "fields": [
            {"name": "마일스톤 A", "value": "06-10 마감", "inline": False},
            {"name": "마일스톤 B", "value": "06-12 마감", "inline": True},
        ],
        "footer": {"text": "Secretary"},
        "timestamp": "2026-06-09T10:00:00Z",
    }
    embed = build_embed(data)
    assert isinstance(embed, discord.Embed)
    assert embed.title == "📅 일정"
    assert embed.description == "이번 주"
    assert embed.color.value == 0x3498DB
    assert len(embed.fields) == 2
    assert embed.fields[0].name == "마일스톤 A"
    assert embed.footer.text == "Secretary"
    assert embed.timestamp is not None


def test_build_embed_minimal():
    embed = build_embed({})
    assert isinstance(embed, discord.Embed)
    assert len(embed.fields) == 0


def test_build_error_embed():
    embed = build_error_embed("network down")
    assert isinstance(embed, discord.Embed)
    assert "network down" in (embed.description or "")
    assert embed.color.value == 0xC0392B
