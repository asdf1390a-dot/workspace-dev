"""Simple structured logger."""
from __future__ import annotations

import logging
import os
import sys

_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)
    logger.setLevel(level)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(_FORMAT))
    logger.addHandler(handler)
    logger.propagate = False
    return logger
