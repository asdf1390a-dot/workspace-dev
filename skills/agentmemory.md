# Agent Memory Skill

**Purpose:** Maintain and leverage persistent, intelligent memory systems across team operations and project continuity. Essential for all agents to maintain long-term context and team knowledge.

**Scope:**
- Personal persistent memory (per-agent learnings and preferences)
- Shared team memory (project facts and decisions)
- Memory validation and integrity checking
- Duplicate detection and consolidation
- Trust score calculation and maintenance
- Cross-session continuity without context loss

**Team Members:** All 15 (CEO + 6 Phase 0 + 4 Phase A/B + 5 Phase C) — **MANDATORY**

**Key Use Cases:**
1. Continuous learning without losing context across sessions
2. Long-term project tracking and historical audit
3. Team knowledge base management and consolidation
4. Decision audit trails and accountability
5. Cross-session continuity with zero knowledge loss

**Components:**
1. **Personal Memory:** Individual agent learnings, preferences, patterns
2. **Shared Memory:** Team decisions, project facts, external references
3. **Validation System:** Duplicate detection, consistency checking, trust scoring
4. **Automation:** Auto-save on significant changes, periodic consolidation
5. **Server:** Persistent memory server (port 13311)

**Installation:**

```bash
# Option 1: Global Installation (Recommended)
npm install -g @agentmemory/agentmemory

# Start memory server
agentmemory start        # Listens on port 13311

# Verify installation
agentmemory demo         # Run sample session & recall verification
agentmemory connect claude-code  # Connect to Claude Code (Codex, Cursor, Gemini compatible)

# Option 2: One-time Use (NPX)
npx @agentmemory/agentmemory
```

**Troubleshooting:**
```bash
# macOS/Linux EACCES permission error
sudo npm install -g @agentmemory/agentmemory

# Clear npm cache
rm -rf ~/.npm/_cacache/_npx

# Windows: Manually delete cache folder
# %LOCALAPPDATA%\npm-cache\_cacache
```

**Structure:**
- `/memory/MEMORY.md` — Central index (user memory, feedback, projects, references)
- `/memory/*.md` — Detailed memory files by category
- `/memory/logs/` — Audit trails and validation logs
- `/memory/dedup_metadata.json` — Duplicate detection tracking
- Port 13311 — Memory server endpoint

**Trust Score Factors:**
- Data completeness (100% if all fields present)
- Source reliability (human input > AI inference)
- Recency (fresher = higher score)
- Validation passes (each successful check increases score)

**Success Criteria:**
- Server starts cleanly on port 13311
- Sample demo completes without errors
- Claude Code connection established
- Historical recall accuracy > 95%

**Activation Date:** 2026-06-02  
**Status:** 🟢 Production Ready
