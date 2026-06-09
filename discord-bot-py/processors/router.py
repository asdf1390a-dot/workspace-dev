"""Message → processor routing based on keyword regex patterns."""
from __future__ import annotations

import re
from typing import Dict, List, Optional, Pattern

from config.constants import COMMAND_PREFIX, ROUTING_PATTERNS

# Pre-compile patterns once at module load.
_COMPILED: Dict[str, List[Pattern[str]]] = {
    name: [re.compile(p, re.IGNORECASE) for p in patterns]
    for name, patterns in ROUTING_PATTERNS.items()
}


def detect_processor(content: str) -> Optional[str]:
    """Return the processor name a message routes to, or None.

    Strips a leading slash prefix when present so that explicit slash commands
    (e.g. `/translate hello`) still match keyword patterns.
    """
    if not content:
        return None

    text = content.strip()
    if text.startswith(COMMAND_PREFIX):
        text = text[len(COMMAND_PREFIX):].strip()

    for processor_name, patterns in _COMPILED.items():
        for pattern in patterns:
            if pattern.search(text):
                return processor_name
    return None
