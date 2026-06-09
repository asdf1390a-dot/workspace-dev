"""Exponential backoff retry helper."""
from __future__ import annotations

import asyncio
from typing import Awaitable, Callable, Tuple, Type, TypeVar

from utils.logger import get_logger

logger = get_logger(__name__)

T = TypeVar("T")


async def retry_async(
    func: Callable[[], Awaitable[T]],
    *,
    max_attempts: int = 3,
    base_delay: float = 1.0,
    retry_on: Tuple[Type[BaseException], ...] = (Exception,),
    operation_name: str = "operation",
) -> T:
    """Run `func` with exponential backoff. Re-raises the last exception."""
    last_exc: BaseException | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            return await func()
        except retry_on as exc:
            last_exc = exc
            if attempt == max_attempts:
                logger.error(
                    "%s failed after %d attempts: %s", operation_name, attempt, exc
                )
                raise
            delay = base_delay * (2 ** (attempt - 1))
            logger.warning(
                "%s attempt %d/%d failed: %s. Retry in %.1fs",
                operation_name,
                attempt,
                max_attempts,
                exc,
                delay,
            )
            await asyncio.sleep(delay)
    # Unreachable, but appeases type checker.
    assert last_exc is not None
    raise last_exc
