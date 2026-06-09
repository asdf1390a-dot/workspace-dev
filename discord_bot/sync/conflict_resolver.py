"""SHA-256 content-hash based dedup.

Backed by discord_sync_log.content_hash. Maintains a small in-process LRU
to avoid hitting Supabase for every message.
"""
from __future__ import annotations

import hashlib
from collections import OrderedDict
from typing import Optional

from supabase import Client

_LRU_CAP = 512
_seen: "OrderedDict[str, None]" = OrderedDict()


def hash_content(message_id: int | str, content: str) -> str:
    payload = f"{message_id}:{content or ''}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _remember(h: str) -> None:
    _seen[h] = None
    _seen.move_to_end(h)
    while len(_seen) > _LRU_CAP:
        _seen.popitem(last=False)


async def exists(supabase: Optional[Client], content_hash: str) -> bool:
    """True if this hash was already synced successfully."""
    if content_hash in _seen:
        return True
    if supabase is None:
        return False
    try:
        res = (
            supabase.table("discord_sync_log")
            .select("id")
            .eq("content_hash", content_hash)
            .in_("sync_status", ["success", "fallback"])
            .limit(1)
            .execute()
        )
        if res.data:
            _remember(content_hash)
            return True
    except Exception:
        # Fail open — better to risk a duplicate than drop a real message.
        return False
    return False


def remember(content_hash: str) -> None:
    """Mark a hash as seen after a successful sync."""
    _remember(content_hash)
