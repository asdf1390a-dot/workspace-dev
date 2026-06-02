# Understand Anything Skill

**Purpose:** Master rapid learning and comprehension of complex topics, documentation, and unfamiliar domains. Enables quick codebase analysis and architecture understanding.

**Scope:**
- Quick context acquisition from complex documentation
- Automatic codebase analysis and knowledge graph generation
- Synthesizing knowledge across domains
- Visual architecture mapping
- Learning from minimal examples

**Team Members:** All 15 (CEO + 6 Phase 0 + 4 Phase A/B + 5 Phase C)  
**Primary Users:** web-builder, Plan, Explore agents

**Key Use Cases:**
1. Onboarding new team members to unfamiliar codebases
2. Understanding legacy or unfamiliar codebases rapidly
3. Architecture visualization and analysis
4. Learning new technologies on-demand
5. Cross-project knowledge transfer
6. System dependency mapping

**Installation:**

```bash
/plugin marketplace add Lucil84/understand-anything
/plugin install understand-anything
```

**Key Commands:**

```bash
# Analyze codebase and generate knowledge graph
/understand
# Generates: understand-anything/knowledge-graph.json
# Supports: en, zh, zh-TW, ja, ko, ru

# Change language
/understand --language ko  # Korean analysis

# Open dashboard
/understand-dashboard
# Visualizes: charts, graphs, code relationships, dependencies
```

**Features:**
- ✅ Automatic knowledge graph generation
- ✅ Chart/graph-based visualization
- ✅ Dashboard UI analysis
- ✅ Auto-generated guide documents
- ✅ Multi-language support (including Korean)

**Process:**
1. Run `/understand` to analyze codebase
2. Review knowledge-graph.json for structure
3. Open `/understand-dashboard` for visual review
4. Ask clarifying questions on unclear relationships
5. Use generated docs for team knowledge base

**Activation Date:** 2026-06-02  
**Status:** 🟢 Production Ready
