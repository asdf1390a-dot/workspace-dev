"""CTB (active_work_tracking.md) parser + diff detector.

Polled every CTB_POLL_INTERVAL_SEC (default 300s). On state change, posts
a formatted Embed to the appropriate Discord channel.
"""
from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime
from typing import Iterable

import discord

from config import CTB_CHANNEL_MAP, STATUS_COLORS, cfg
from sync.discord_sync import DiscordSync
from sync.telegram_sync import TelegramSync

log = logging.getLogger(__name__)

# Loose status pattern. Tasks in active_work_tracking.md look like
#   - **Task name** — STATUS — assignee — eta:HH:MM
# We tolerate variation and just key off "TASK_NAME :: STATUS :: ASSIGNEE :: ETA".
_LINE = re.compile(
    r"^[-*]\s+\*{0,2}(?P<name>[^*\n]+?)\*{0,2}\s*[—:|-]+\s*"
    r"(?P<status>PENDING|IN_PROGRESS|COMPLETED|BLOCKED)\s*"
    r"[—:|-]+\s*(?P<assignee>[^—:|\n]+?)"
    r"(?:\s*[—:|-]+\s*(?P<eta>[^\n]+))?$",
    re.MULTILINE,
)


class CTBSync:
    def __init__(self, discord_sync: DiscordSync, telegram_sync: TelegramSync) -> None:
        self.discord_sync = discord_sync
        self.telegram_sync = telegram_sync
        self.state_file = cfg.ctb_state_file
        self.source_file = cfg.ctb_source_file

    def _parse(self) -> dict[str, dict]:
        if not os.path.exists(self.source_file):
            log.warning("CTB source file missing: %s", self.source_file)
            return {}
        try:
            with open(self.source_file, "r", encoding="utf-8") as fp:
                text = fp.read()
        except Exception as e:
            log.error("CTB read failed: %s", e)
            return {}

        out: dict[str, dict] = {}
        for m in _LINE.finditer(text):
            name = m.group("name").strip()
            out[name] = {
                "task_name": name,
                "status": m.group("status").strip(),
                "assignee": (m.group("assignee") or "").strip(),
                "eta": (m.group("eta") or "").strip() or "-",
            }
        return out

    def _load_previous(self) -> dict[str, dict]:
        if not os.path.exists(self.state_file):
            return {}
        try:
            with open(self.state_file, "r", encoding="utf-8") as fp:
                return json.load(fp)
        except Exception:
            return {}

    def _save_state(self, current: dict[str, dict]) -> None:
        try:
            os.makedirs(os.path.dirname(self.state_file) or ".", exist_ok=True)
            with open(self.state_file, "w", encoding="utf-8") as fp:
                json.dump(current, fp, ensure_ascii=False)
        except Exception as e:
            log.warning("CTB state save failed: %s", e)

    def _diff(self, prev: dict[str, dict], curr: dict[str, dict]) -> list[dict]:
        changes: list[dict] = []
        for name, row in curr.items():
            prior = prev.get(name)
            if prior is None:
                changes.append({**row, "old_status": "NEW", "new_status": row["status"]})
            elif prior.get("status") != row["status"]:
                changes.append(
                    {**row, "old_status": prior.get("status", "?"), "new_status": row["status"]}
                )
        return changes

    async def poll_once(self) -> list[dict]:
        current = self._parse()
        previous = self._load_previous()
        changes = self._diff(previous, current)
        for change in changes:
            try:
                await self.post_change(change)
            except Exception as e:
                log.error("CTB post failed for %s: %s", change.get("task_name"), e)
        if changes:
            self._save_state(current)
        return changes

    async def post_change(self, change: dict) -> None:
        status = change["new_status"]
        channel_id = CTB_CHANNEL_MAP.get(status)
        if not channel_id:
            return

        embed = discord.Embed(
            title=f"【{status}】 {change['task_name']}",
            color=STATUS_COLORS.get(status, 0x94A3B8),
            timestamp=datetime.utcnow(),
        )
        embed.add_field(name="담당자", value=change.get("assignee") or "-", inline=True)
        embed.add_field(name="ETA", value=change.get("eta") or "-", inline=True)
        embed.add_field(
            name="상태",
            value=f"{change.get('old_status', '?')} → {status}",
            inline=False,
        )

        await self.discord_sync.send(channel_id=channel_id, embed=embed)

        # Mirror critical states to CEO DM
        if status in ("BLOCKED", "COMPLETED"):
            tag = {"BLOCKED": "【블로커】", "COMPLETED": "【완료】"}[status]
            try:
                await self.telegram_sync.send(
                    f"{tag} {change['task_name']}\n"
                    f"담당자: {change.get('assignee') or '-'}\n"
                    f"상태: {change.get('old_status', '?')} → {status}"
                )
            except Exception as e:
                log.warning("Telegram mirror failed: %s", e)


def changes_iter(prev: dict, curr: dict) -> Iterable[dict]:
    """Pure helper for unit testing."""
    for name, row in curr.items():
        prior = prev.get(name)
        if prior is None or prior.get("status") != row.get("status"):
            yield {
                **row,
                "old_status": (prior or {}).get("status", "NEW"),
                "new_status": row.get("status"),
            }
