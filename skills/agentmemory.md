# Agent Memory Skill

**Purpose:** Maintain and leverage persistent, intelligent memory systems across team operations and project continuity.

**Scope:**
- Personal persistent memory (per-agent learnings and preferences)
- Shared team memory (project facts and decisions)
- Memory validation and integrity checking
- Duplicate detection and consolidation
- Trust score calculation and maintenance

**Team Members:** All 15 (CEO + 6 Phase 0 + 4 Phase A/B + 5 Phase C)

**Key Use Cases:**
1. Continuous learning without losing context
2. Long-term project tracking
3. Team knowledge base management
4. Decision audit trails
5. Cross-session continuity

**Components:**
1. **Personal Memory:** Individual agent learnings, preferences, patterns
2. **Shared Memory:** Team decisions, project facts, external references
3. **Validation System:** Duplicate detection, consistency checking, trust scoring
4. **Automation:** Auto-save on significant changes, periodic consolidation

**Structure:**
- `/memory/MEMORY.md` — Central index (user memory, feedback, projects, references)
- `/memory/*.md` — Detailed memory files by category
- `/memory/logs/` — Audit trails and validation logs
- `/memory/dedup_metadata.json` — Duplicate detection tracking

**Trust Score Factors:**
- Data completeness (100% if all fields present)
- Source reliability (human input > AI inference)
- Recency (fresher = higher score)
- Validation passes (each successful check increases score)

**Activation Date:** 2026-06-02
