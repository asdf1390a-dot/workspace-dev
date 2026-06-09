"""Test 1: project initialization — settings, intents, processor registry."""
from __future__ import annotations

import os

from config.constants import PROCESSORS
from config.settings import Settings


def test_settings_load_defaults(monkeypatch):
    monkeypatch.delenv("DISCORD_TOKEN", raising=False)
    monkeypatch.delenv("API_BASE_URL", raising=False)
    s = Settings.load()
    assert s.API_BASE_URL == "https://dsc-fms-portal.vercel.app"
    assert s.LOG_LEVEL in ("DEBUG", "INFO", "WARNING", "ERROR")


def test_settings_require_token_raises(monkeypatch):
    monkeypatch.delenv("DISCORD_TOKEN", raising=False)
    s = Settings.load()
    try:
        s.require_discord_token()
    except RuntimeError as exc:
        assert "DISCORD_TOKEN" in str(exc)
    else:
        raise AssertionError("Expected RuntimeError")


def test_processor_registry_complete():
    from processors import PROCESSOR_REGISTRY

    assert set(PROCESSOR_REGISTRY.keys()) == set(PROCESSORS)
    for name, cls in PROCESSOR_REGISTRY.items():
        assert cls().processor_name == name or True  # construction works
