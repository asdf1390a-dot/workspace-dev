"""Discord /task slash command handler."""
from __future__ import annotations

import logging
from typing import Optional

import discord
from discord import app_commands
from supabase import Client

from config import cfg
from sync.telegram_sync import TelegramSync

log = logging.getLogger(__name__)


class TaskHandler:
    def __init__(self, supabase: Optional[Client], telegram_sync: TelegramSync) -> None:
        self.supabase = supabase
        self.telegram_sync = telegram_sync

    def register(self, tree: app_commands.CommandTree) -> None:
        @tree.command(name="task", description="작업 지시 (assign a task to a member)")
        @app_commands.describe(
            assign="담당자 (member name)",
            description="작업 내용 (5~500 chars)",
            priority="우선순위 P0/P1/P2",
        )
        async def task_cmd(
            interaction: discord.Interaction,
            assign: str,
            description: str,
            priority: Optional[str] = "P1",
        ):
            await interaction.response.defer(ephemeral=False, thinking=True)

            # Validate assignee
            if assign not in cfg.valid_assignees:
                valid = ", ".join(cfg.valid_assignees)
                embed = discord.Embed(
                    title="❌ 잘못된 담당자",
                    description=f"`{assign}` 은(는) 등록된 멤버가 아닙니다.\n\n유효 멤버: {valid}",
                    color=0xEF4444,
                )
                await interaction.followup.send(embed=embed)
                return

            # Validate description length
            if not (5 <= len(description) <= 500):
                await interaction.followup.send(
                    embed=discord.Embed(
                        title="❌ 작업 설명 길이 오류",
                        description="작업 설명은 5~500자 사이여야 합니다.",
                        color=0xEF4444,
                    )
                )
                return

            if priority not in ("P0", "P1", "P2"):
                priority = "P1"

            # Insert into task queue
            row = None
            if self.supabase is not None:
                try:
                    res = (
                        self.supabase.table("discord_task_queue")
                        .insert(
                            {
                                "assigned_to": assign,
                                "task_description": description,
                                "priority": priority,
                                "platform_origin": "discord",
                                "status": "pending",
                            }
                        )
                        .execute()
                    )
                    row = (res.data or [None])[0]
                except Exception as e:
                    log.error("task insert failed: %s", e)
                    await interaction.followup.send(
                        embed=discord.Embed(
                            title="❌ DB 오류",
                            description=str(e)[:300],
                            color=0xEF4444,
                        )
                    )
                    return

            # Discord confirmation embed
            embed = discord.Embed(
                title=f"📋 새 작업 — {priority}",
                description=description,
                color=0x3B82F6,
            )
            embed.add_field(name="담당자", value=assign, inline=True)
            embed.add_field(name="상태", value="pending", inline=True)
            if row and row.get("id"):
                embed.set_footer(text=f"task #{row['id']}")
            await interaction.followup.send(embed=embed)

            # Telegram CEO notification
            try:
                await self.telegram_sync.send(
                    f"【새작업 {priority}】 @{assign}\n{description}"
                )
            except Exception as e:
                log.warning("telegram task notify failed: %s", e)

            # Notification log
            if self.supabase is not None:
                try:
                    self.supabase.table("discord_notifications").insert(
                        {
                            "notify_type": "task_assigned",
                            "content": f"@{assign} {description}",
                            "platform": "both",
                        }
                    ).execute()
                except Exception:
                    pass
