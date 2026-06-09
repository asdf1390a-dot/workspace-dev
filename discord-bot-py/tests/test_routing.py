"""Test 2: regex-based processor detection."""
from __future__ import annotations

import pytest

from processors.router import detect_processor


@pytest.mark.parametrize(
    "content,expected",
    [
        ("일정 확인", "secretary"),
        ("show me the schedule please", "secretary"),
        ("번역: hello", "translator"),
        ("/translate 안녕하세요", "translator"),
        ("자산 수 알려줘", "analyst"),
        ("breakdown statistics", "analyst"),
        ("KPI report", "analyst"),
        ("이 에러 좀 봐줘", "developer"),
        ("debug help", "developer"),
        ("로드맵 보여줘", "planner"),
        ("design architecture review", "planner"),
        ("just chatting about lunch", None),
        ("", None),
    ],
)
def test_detect_processor(content, expected):
    assert detect_processor(content) == expected
