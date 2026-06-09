# DSC Discord Bot (Phase 1)

Python discord.py bot that routes Discord messages to 5 processor endpoints
(Secretary, Translator, Analyst, Developer, Planner) on the Next.js portal.

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
make install
cp .env.example .env  # then fill in DISCORD_TOKEN, etc.
```

## Run

```bash
make run
```

## Test

```bash
make test
```

## Phase 1 scope

- Discord client init + on_ready / on_message handlers
- Keyword-based routing to 5 processors via regex
- API integration to `${API_BASE_URL}/api/discord/processors/{name}` (aiohttp)
- Exponential backoff retry (3 attempts)
- pytest: init, routing, API call mock, embed format, full message flow
