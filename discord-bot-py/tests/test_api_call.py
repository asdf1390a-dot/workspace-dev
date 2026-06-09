"""Test 3: BaseProcessor.call — happy path, error path, retry."""
from __future__ import annotations

from unittest.mock import patch

import aiohttp
import pytest

from processors.base import BaseProcessor, ProcessorError
from processors.secretary import SecretaryProcessor


SAMPLE_OK = {
    "success": True,
    "embed": {
        "title": "📅 주간 일정 현황",
        "description": "마일스톤 3건",
        "color": 0x3498DB,
        "fields": [{"name": "마일스톤", "value": "Phase 1", "inline": False}],
        "footer": {"text": "by Secretary"},
        "timestamp": "2026-06-09T10:00:00Z",
    },
}


async def _fake_post_ok(self, payload):
    return SAMPLE_OK


async def _fake_post_fail(self, payload):
    return {"success": False, "error": "no data"}


@pytest.mark.asyncio
async def test_processor_call_success():
    proc = SecretaryProcessor()
    with patch.object(BaseProcessor, "_post", _fake_post_ok):
        result = await proc.call(
            message_id="1",
            channel_id="2",
            user_id="3",
            username="tester",
            content="일정",
            timestamp="2026-06-09T10:00:00Z",
        )
    assert result["success"] is True
    assert result["embed"]["title"].startswith("📅")


@pytest.mark.asyncio
async def test_processor_call_logical_error_raises():
    proc = SecretaryProcessor()
    with patch.object(BaseProcessor, "_post", _fake_post_fail):
        with pytest.raises(ProcessorError):
            await proc.call(
                message_id="1",
                channel_id="2",
                user_id="3",
                username="tester",
                content="일정",
                timestamp="2026-06-09T10:00:00Z",
            )


@pytest.mark.asyncio
async def test_processor_call_retries_then_succeeds(monkeypatch):
    """First two attempts raise ClientError, third returns OK."""
    calls = {"n": 0}

    async def flaky_post(self, payload):
        calls["n"] += 1
        if calls["n"] < 3:
            raise aiohttp.ClientError("transient")
        return SAMPLE_OK

    # Speed up backoff
    monkeypatch.setattr("processors.base.API_BACKOFF_BASE_SECONDS", 0.0)

    with patch.object(BaseProcessor, "_post", flaky_post):
        result = await SecretaryProcessor().call(
            message_id="1",
            channel_id="2",
            user_id="3",
            username="tester",
            content="일정",
            timestamp="2026-06-09T10:00:00Z",
        )
    assert result["success"] is True
    assert calls["n"] == 3
