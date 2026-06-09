"""Discord Bot entrypoint (Phase 1)."""
from __future__ import annotations

from bot.client import create_client
from bot.events import register_events
from config.settings import Settings
from utils.logger import get_logger

logger = get_logger(__name__)


def main() -> None:
    settings = Settings.load()
    token = settings.require_discord_token()

    client = create_client()
    register_events(client)

    logger.info("Starting Discord bot. API_BASE_URL=%s", settings.API_BASE_URL)
    client.run(token)


if __name__ == "__main__":
    main()
