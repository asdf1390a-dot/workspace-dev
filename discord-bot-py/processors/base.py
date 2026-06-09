"""BaseProcessor: HTTP caller for Next.js processor endpoints."""
from __future__ import annotations

import asyncio
from typing import Any, Dict, Optional

import aiohttp

from config.constants import (
    API_BACKOFF_BASE_SECONDS,
    API_MAX_RETRIES,
    API_TIMEOUT_SECONDS,
)
from config.settings import Settings
from utils.logger import get_logger
from utils.retry import retry_async

logger = get_logger(__name__)


class ProcessorError(RuntimeError):
    """Raised when the upstream processor returns an error or invalid payload."""


class BaseProcessor:
    """Abstract caller for `${API_BASE_URL}/api/discord/processors/{name}`."""

    processor_name: str = ""

    def __init__(
        self,
        settings: Optional[Settings] = None,
        session: Optional[aiohttp.ClientSession] = None,
    ) -> None:
        if not self.processor_name:
            raise ValueError("Subclass must set processor_name")
        self.settings = settings or Settings.load()
        self._session = session  # Optional injected session (testing / pooling)

    @property
    def endpoint(self) -> str:
        return f"{self.settings.API_BASE_URL}/api/discord/processors/{self.processor_name}"

    async def call(
        self,
        *,
        message_id: str,
        channel_id: str,
        user_id: str,
        username: str,
        content: str,
        timestamp: str,
    ) -> Dict[str, Any]:
        """Call the processor endpoint and return the parsed JSON response.

        Retries up to `API_MAX_RETRIES` on network/timeout errors with
        exponential backoff. Raises `ProcessorError` on logical failure.
        """
        payload = {
            "messageId": message_id,
            "channelId": channel_id,
            "userId": user_id,
            "username": username,
            "content": content,
            "timestamp": timestamp,
        }

        async def _do_request() -> Dict[str, Any]:
            return await self._post(payload)

        data = await retry_async(
            _do_request,
            max_attempts=API_MAX_RETRIES,
            base_delay=API_BACKOFF_BASE_SECONDS,
            retry_on=(asyncio.TimeoutError, aiohttp.ClientError),
            operation_name=f"processor.{self.processor_name}",
        )

        if not data.get("success"):
            raise ProcessorError(
                f"Processor {self.processor_name} returned error: "
                f"{data.get('error', 'unknown')}"
            )
        return data

    async def _post(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        timeout = aiohttp.ClientTimeout(total=API_TIMEOUT_SECONDS)
        if self._session is not None:
            async with self._session.post(
                self.endpoint, json=payload, timeout=timeout
            ) as resp:
                resp.raise_for_status()
                return await resp.json()

        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.endpoint, json=payload, timeout=timeout
            ) as resp:
                resp.raise_for_status()
                return await resp.json()
