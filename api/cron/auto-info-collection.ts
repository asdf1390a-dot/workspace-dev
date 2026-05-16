import { NextRequest, NextResponse } from "next/server";

/**
 * Auto Info Collection Cron Job
 * 매일 08:00 KST에 자동 실행
 *
 * Environment Variables:
 * - TELEGRAM_BOT_TOKEN
 * - TELEGRAM_CHAT_ID (비서 채널)
 * - GITHUB_TOKEN (선택)
 * - DEVTO_API_KEY (선택)
 */

interface CollectedItem {
  title: string;
  url: string;
  description?: string;
  [key: string]: any;
}

interface CollectionResult {
  [source: string]: CollectedItem[];
}

async function collectGitHubTrending(): Promise<CollectedItem[]> {
  try {
    const languages = ["python", "javascript"];
    const results: CollectedItem[] = [];

    for (const lang of languages) {
      const query = `language:${lang} stars:>1000`;
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`,
        {
          headers: process.env.GITHUB_TOKEN
            ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
            : {},
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      for (const repo of data.items?.slice(0, 3) || []) {
        results.push({
          title: repo.name,
          url: repo.html_url,
          description: repo.description || "No description",
          stars: repo.stargazers_count,
          language: repo.language || "Multi",
        });
      }
    }

    return results;
  } catch (error) {
    console.error("GitHub Trending error:", error);
    return [];
  }
}

async function collectProductHunt(): Promise<CollectedItem[]> {
  try {
    const response = await fetch("https://api.producthunt.com/v2/posts?days_ago=1&order=newest&per_page=10");

    if (!response.ok) return [];

    const data = await response.json();
    const results: CollectedItem[] = [];

    for (const post of data.data?.slice(0, 5) || []) {
      const tags = post.tag_objs?.map((t: any) => t.name?.toLowerCase()) || [];
      const isRelevant = tags.some((t: string) =>
        ["dev", "tool", "saas", "api", "automation"].includes(t)
      );

      if (isRelevant) {
        results.push({
          title: post.name,
          url: post.url,
          description: post.tagline || "",
          votes: post.votes_count,
          tags: tags.slice(0, 3).join(", "),
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Product Hunt error:", error);
    return [];
  }
}

async function collectDevTo(): Promise<CollectedItem[]> {
  try {
    const tags = "nextjs,react,supabase";
    const response = await fetch(
      `https://dev.to/api/articles?tag=${tags}&per_page=10&sort=latest`,
      process.env.DEVTO_API_KEY
        ? { headers: { "api-key": process.env.DEVTO_API_KEY } }
        : {}
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data || []).slice(0, 5).map((article: any) => ({
      title: article.title,
      url: article.url,
      author: article.user?.name,
      reading_time: article.reading_time_minutes || 5,
      reactions: article.public_reactions_count || 0,
    }));
  } catch (error) {
    console.error("Dev.to error:", error);
    return [];
  }
}

async function collectSupabaseNews(): Promise<CollectedItem[]> {
  try {
    // Supabase 공식 페이지에서 뉴스 (간단한 버전)
    return [
      {
        title: "Check Supabase Blog for latest updates",
        url: "https://supabase.com/blog",
        description: "Supabase features, case studies, and announcements",
      },
    ];
  } catch (error) {
    console.error("Supabase news error:", error);
    return [];
  }
}

async function collectVercelNews(): Promise<CollectedItem[]> {
  try {
    // Vercel 공식 페이지에서 뉴스
    return [
      {
        title: "Check Vercel Blog for latest updates",
        url: "https://vercel.com/blog",
        description: "Next.js, Vercel Platform announcements and tutorials",
      },
    ];
  } catch (error) {
    console.error("Vercel news error:", error);
    return [];
  }
}

async function formatTelegramMessage(items: CollectionResult): Promise<string> {
  const timestamp = new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });

  let message = `📚 *Daily Info Collection*\n_${timestamp}_\n\n`;

  const sourceEmojis: Record<string, string> = {
    "GitHub Trending": "🌟",
    "Product Hunt": "🎯",
    "Dev.to": "📝",
    "Supabase": "🔵",
    Vercel: "⚫",
  };

  for (const [source, articles] of Object.entries(items)) {
    if (articles.length > 0) {
      const emoji = sourceEmojis[source] || "📌";
      message += `${emoji} *${source}*\n`;

      for (let i = 0; i < Math.min(articles.length, 3); i++) {
        const article = articles[i];
        message += `${i + 1}. [${article.title}](${article.url})\n`;
      }

      message += "\n";
    }
  }

  // Add ecosystem context
  message += "📊 *생태계 개발 관련*\n";
  message += "✅ Data Platform — 분석/예측 기술\n";
  message += "✅ Mobile App — React Native/Flutter 신기능\n";
  message += "✅ DevOps — GitHub Actions, Vercel 자동화\n";

  return message;
}

async function sendTelegram(message: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error("Missing Telegram credentials");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
          disable_web_page_preview: false,
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Telegram send error:", error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const cronSecret = request.headers.get("authorization");
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Collect from all sources in parallel
    const [github, ph, devto, supabase, vercel] = await Promise.all([
      collectGitHubTrending(),
      collectProductHunt(),
      collectDevTo(),
      collectSupabaseNews(),
      collectVercelNews(),
    ]);

    const items: CollectionResult = {
      "GitHub Trending": github,
      "Product Hunt": ph,
      "Dev.to": devto,
      Supabase: supabase,
      Vercel: vercel,
    };

    // Format and send
    const message = await formatTelegramMessage(items);
    const sent = await sendTelegram(message);

    return NextResponse.json({
      success: sent,
      timestamp: new Date().toISOString(),
      sources: Object.keys(items),
      itemCount: Object.values(items).reduce((sum, arr) => sum + arr.length, 0),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) },
      { status: 500 }
    );
  }
}
