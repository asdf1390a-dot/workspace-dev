"""Convert processor API response dicts to discord.Embed."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

import discord

from config.constants import COLOR_DEFAULT, COLOR_ERROR


def build_embed(data: Dict[str, Any]) -> discord.Embed:
    """Build a discord.Embed from a processor `embed` payload.

    Expected shape (matching design):
      { title, description, color, fields: [{name, value, inline}],
        footer: {text}, timestamp }
    """
    embed = discord.Embed(
        title=data.get("title"),
        description=data.get("description"),
        color=discord.Color(data.get("color", COLOR_DEFAULT)),
    )

    for field in data.get("fields") or []:
        embed.add_field(
            name=field.get("name", "​"),
            value=field.get("value", "​"),
            inline=bool(field.get("inline", False)),
        )

    footer = data.get("footer") or {}
    if footer.get("text"):
        embed.set_footer(text=footer["text"])

    ts = data.get("timestamp")
    if ts:
        embed.timestamp = _parse_timestamp(ts)
    return embed


def build_error_embed(message: str, *, title: str = "오류 / Error") -> discord.Embed:
    return discord.Embed(
        title=title, description=message, color=discord.Color(COLOR_ERROR)
    )


def _parse_timestamp(value: Any) -> Optional[datetime]:
    if isinstance(value, datetime):
        return value
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(float(value), tz=timezone.utc)
    if isinstance(value, str):
        try:
            # Handle trailing Z
            if value.endswith("Z"):
                value = value[:-1] + "+00:00"
            return datetime.fromisoformat(value)
        except ValueError:
            return None
    return None
