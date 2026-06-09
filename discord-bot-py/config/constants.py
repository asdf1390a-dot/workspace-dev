"""Constants: embed colors, regex patterns, processor names."""
from __future__ import annotations

# Discord embed colors
COLOR_SECRETARY = 0x3498DB
COLOR_TRANSLATOR = 0x2ECC71
COLOR_ANALYST = 0xF39C12
COLOR_DEVELOPER = 0xE74C3C
COLOR_PLANNER = 0x9B59B6
COLOR_ERROR = 0xC0392B
COLOR_DEFAULT = 0x95A5A6

# Processor names
PROCESSORS = ("secretary", "translator", "analyst", "developer", "planner")

# Keyword routing patterns (Korean + English).
# Order matters: first match wins.
ROUTING_PATTERNS = {
    "translator": [
        r"^번역\s*:",
        r"^translate\s*:",
        r"\b번역\b",
        r"\btranslate\b",
    ],
    "secretary": [
        r"일정",
        r"스케줄",
        r"\bschedule\b",
        r"작업\s*상태",
        r"\bprogress\b",
    ],
    "analyst": [
        r"자산",
        r"에셋",
        r"\basset(s)?\b",
        r"\bequipment\b",
        r"고장",
        r"\bbreakdown\b",
        r"장애",
        r"\bkpi\b",
        r"지표",
    ],
    "developer": [
        r"에러",
        r"오류",
        r"\berror\b",
        r"\bbug\b",
        r"코드\s*리뷰",
        r"\bcode\s*review\b",
        r"디버그",
        r"\bdebug\b",
    ],
    "planner": [
        r"로드맵",
        r"\broadmap\b",
        r"우선순위",
        r"\bpriority\b",
        r"설계",
        r"\bdesign\b",
        r"아키텍처",
        r"\barchitecture\b",
    ],
}

# Slash command prefix (used to skip prefix-based routing)
COMMAND_PREFIX = "/"

# API
API_TIMEOUT_SECONDS = 10
API_MAX_RETRIES = 3
API_BACKOFF_BASE_SECONDS = 1.0
