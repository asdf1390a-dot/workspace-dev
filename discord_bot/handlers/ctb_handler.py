"""Background task: poll CTB file every N seconds and emit changes."""
from __future__ import annotations

import asyncio
import logging

from config import cfg
from sync.ctb_sync import CTBSync

log = logging.getLogger(__name__)


class CTBHandler:
    def __init__(self, ctb_sync: CTBSync) -> None:
        self.ctb_sync = ctb_sync
        self._task: asyncio.Task | None = None

    def start(self) -> None:
        if self._task and not self._task.done():
            return
        self._task = asyncio.create_task(self._loop(), name="ctb-poll")

    def stop(self) -> None:
        if self._task:
            self._task.cancel()

    async def _loop(self) -> None:
        interval = max(30, cfg.ctb_poll_interval_sec)
        log.info("CTB poll loop start (interval=%ds)", interval)
        while True:
            try:
                changes = await self.ctb_sync.poll_once()
                if changes:
                    log.info("CTB changes posted: %d", len(changes))
            except asyncio.CancelledError:
                break
            except Exception as e:
                log.error("CTB poll cycle failed: %s", e)
            await asyncio.sleep(interval)
