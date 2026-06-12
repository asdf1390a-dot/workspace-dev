"""Discord translator channel handler — converts Korean ↔ English using processor API."""
from __future__ import annotations

import logging
from typing import Optional

import discord
from supabase import Client

from config import cfg

log = logging.getLogger(__name__)


class TranslatorHandler:
    def __init__(self, supabase: Optional[Client]) -> None:
        self.supabase = supabase
        self.translator_channel_id = cfg.channel_translator
        self.processor_url = "http://localhost:3002/api/discord/processors/translator"

    async def handle_translator_message(self, message: discord.Message) -> None:
        """Process translation requests in translator channel using Claude API."""
        if message.author.bot:
            return
        if message.channel.id != self.translator_channel_id:
            return
        if not (message.content or "").strip():
            return

        try:
            korean_text = message.content

            # Show typing indicator while translating
            async with message.channel.typing():
                translated = await self._translate_with_claude(korean_text)

            if translated and translated.strip() != korean_text.strip():
                embed = discord.Embed(
                    title="✅ Translation Result",
                    color=0x10B981,  # green
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
                embed.set_footer(text="Powered by Claude API")

                await message.reply(embed=embed, mention_author=False)
                log.info(f"✅ Translated {len(korean_text)} chars from {message.author.display_name}")
            else:
                await message.reply(
                    "⚠️ Translation unchanged or failed. Please try again.",
                    mention_author=False,
                )
        except Exception as e:
            log.error(f"❌ Translation error: {e}")
            await message.reply(
                f"❌ Translation error: {str(e)[:100]}",
                mention_author=False,
            )

    async def _translate_with_claude(self, text: str) -> Optional[str]:
        """Translate Korean ↔ English using processor API."""
        import httpx

        try:
            payload = {
                "messageId": "",
                "channelId": str(self.translator_channel_id),
                "userId": "",
                "username": "Discord Bot",
                "content": text,
                "timestamp": "",
            }
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(self.processor_url, json=payload)
                if resp.status_code != 200:
                    log.error(f"Processor API error: {resp.status_code}")
                    return None
                data = resp.json()
                if data.get("success") and data.get("embed"):
                    fields = data["embed"].get("fields", [])
                    if len(fields) >= 2:
                        translated = fields[1].get("value", "").strip()
                        translated = translated.replace("```\n", "").replace("\n```", "")
                        log.info(f"Processor translation: {len(text)} chars → {len(translated)} chars")
                        return translated
                return None
        except Exception as e:
            log.error(f"Processor API error: {e}")
            return None
