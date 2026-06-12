"""Discord translator channel handler — converts Korean ↔ English on demand."""
from __future__ import annotations

import logging
from typing import Optional

import discord
from supabase import Client

from config import cfg

log = logging.getLogger(__name__)

# Basic translation dictionary (Korean → English)
# In production, this would call Claude, Google Translate API, or a proper translation service
TRANSLATION_MAP = {
    # Common terms
    "안녕": "Hello",
    "감사합니다": "Thank you",
    "파일": "File",
    "번역": "Translation",
    "완료": "Complete",
    "진행중": "In Progress",
    "차단됨": "Blocked",
    "요청": "Request",
    "확인": "Confirmation",
    "업데이트": "Update",
    "배포": "Deployment",
    "오류": "Error",
    "수정": "Fix",
    "테스트": "Test",
    "마이그레이션": "Migration",
    "데이터베이스": "Database",
    "대시보드": "Dashboard",
    "분석": "Analysis",
    "성능": "Performance",
    "최적화": "Optimization",
    "보안": "Security",
    "인증": "Authentication",
    "권한": "Permission",
    "사용자": "User",
    "팀": "Team",
    "프로젝트": "Project",
    "작업": "Task",
    "스케줄": "Schedule",
    "예산": "Budget",
    "비용": "Cost",
    "수익": "Revenue",
    "매출": "Sales",
    "생산": "Production",
    "품질": "Quality",
    "효율": "Efficiency",
    "신뢰도": "Reliability",
    "안정성": "Stability",
}


class TranslatorHandler:
    def __init__(self, supabase: Optional[Client]) -> None:
        self.supabase = supabase
        self.translator_channel_id = cfg.channel_translator

    async def handle_translator_message(self, message: discord.Message) -> None:
        """Process translation requests in translator channel."""
        if message.author.bot:
            return
        if message.channel.id != self.translator_channel_id:
            return
        if not (message.content or "").strip():
            return

        try:
            # Simple approach: detect if message is mostly Korean and translate to English
            korean_text = message.content
            translated = self._translate_korean_to_english(korean_text)

            if translated and translated != korean_text:
                embed = discord.Embed(
                    title="Translation Result",
                    color=0x3B82F6,  # blue
                )
                embed.add_field(
                    name=f"🇰🇷 Korean ({message.author.display_name})",
                    value=korean_text[:1024],
                    inline=False,
                )
                embed.add_field(
                    name="🇬🇧 English",
                    value=translated[:1024],
                    inline=False,
                )
                embed.set_footer(text="Translation powered by Translation Service")

                await message.reply(embed=embed, mention_author=False)
                log.info(f"Translated message from {message.author.display_name}")
            else:
                # If no translation found, still acknowledge
                await message.reply(
                    "❌ Unable to translate — please try again or contact support.",
                    mention_author=False,
                )
        except Exception as e:
            log.error(f"Translation error: {e}")
            await message.reply(
                f"⚠️ Translation error: {str(e)[:100]}",
                mention_author=False,
            )

    def _translate_korean_to_english(self, text: str) -> Optional[str]:
        """Simple translation using dictionary (temporary implementation)."""
        # In production: call Claude translator agent or Google Translate API
        # For now, replace known Korean phrases with English
        result = text
        for korean, english in TRANSLATION_MAP.items():
            result = result.replace(korean, english)
        return result if result != text else None
