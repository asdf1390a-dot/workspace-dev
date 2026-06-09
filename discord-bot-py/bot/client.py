"""Factory for the discord.Client instance."""
from __future__ import annotations

import discord

from utils.logger import get_logger

logger = get_logger(__name__)


def create_intents() -> discord.Intents:
    intents = discord.Intents.default()
    intents.message_content = True
    intents.members = True
    return intents


def create_client() -> discord.Client:
    """Return a configured discord.Client (no commands extension required for P1)."""
    intents = create_intents()
    client = discord.Client(intents=intents)
    logger.debug("discord.Client created with intents: message_content + members")
    return client
