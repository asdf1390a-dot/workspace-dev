---
name: DSC FMS Portal project
description: User's in-progress Next.js portal at dsc-fms-portal.vercel.app for automating Daechang Seat Chennai plant operations
type: project
originSessionId: 1d93050d-fce3-47dd-a9eb-0fd0153fc0a4
---
**Repo:** https://github.com/asdf1390a-dot/dsc-fms-portal (deployed at https://dsc-fms-portal.vercel.app/)
**Company:** Daechang Seat (DSC), automotive seat manufacturer — Chennai Plant, India
**Stack:** Next.js 14 + React 18 (Pages Router), single file `pages/index.js` (~600 lines), Vercel deploy. No backend, no DB, no auth — all state is hardcoded mock data.
**Languages supported in UI:** ko / en / hi / ta (Korean / English / Hindi / Tamil)

**Production lines & assets:** FRAM (48 machines), CCB (62), PRESS (31), PROJECTION (27) — 168 production-line assets. **TOTAL plant assets ~496 (Jan 2025)** including utility/jigs/moulds/etc. Departments include 생산관리, 보전, 금형, 프레스, CCB.

**Existing master list (Excel):** `MASTER_LIST_OF_MACHINES_DSC_MANNUR_REV_01.xls` — REV 01 dated 2025-01-09. 20+ sheets organized by 15 categories (01=UTILITY, 02=PROCESS, 03=PRESS, 04=ROBOT, 05=WELDING, 06=ASSEMBLY, 07=ETC, 08=LASER, 09=JIG, 10=MOULD, 11=IDLE, 12=SALES, 13=DISPOSAL, 14=CNC, 15=PALLET). Asset numbering: hierarchical numeric `01.001.001` + tag-based `DCMI-UTL-PSF-01` (DCMI = company, dept-prefix, equip-subtype, sequence). Plant nicknamed "DSC MANNUR" (Mannur = Chennai plant location). Author: SUNDER (Indian colleague). Per-row fields: ASSET CODE CLASSIFICATION, MACHINE ASSET CODE, MACHINE ASSET NUMBER, SERIAL NO, MACHINE NAME, MODEL, MAKE, LOCATION, REMARK. WORK HISTORY sheet exists but mostly empty — opportunity for BM history module to replace.

**Status (as of commit 15e1e77):**
- Built: Dashboard, Settings (lang + user list + role-based permissions UI, all in-memory)
- Placeholder ("Coming soon"): 설비 마스터 (master), 가동률 OEE (avail), BM 이력, PM Plan, 작업지시 (wo), 부품/재고 (parts), KPI 리포트, 팀 관리
- Missing: persistence (DB), auth, file/CSV import-export, mobile hamburger button is `display:none`

**Why:** Automate work for 4 departments (생산/기술/보전/생산관리) the user oversees as GM. Replace paper/Excel-based shop-floor tracking.

**Decisions made (2026-05-09 session):**
- Build order: 보전팀(maintenance) module first
- Mobile-first; local Indian staff continuously update base data
- Auth: employee ID OR email login
- Operator-facing input forms: English + Tamil only (Chennai is Tamil-speaking; Hindi dropped). UI shell can keep ko/en/hi/ta.
- First sub-module: **Asset Master** (foundation for BM/PM/parts which all reference assets)
- DB: **Supabase** (auth + Postgres + storage for breakdown photos, free tier start)
- Asset coding: **reuse existing Excel scheme** (numeric `01.001.001` + tag `DCMI-UTL-PSF-01`), no new conventions
- Initial data load: **import all ~496 assets from existing Excel master** (REV 01) rather than manual entry
- Physical labels: **NOT yet attached** to machines → label printing & attachment is a follow-up field task after digital master goes live

**How to apply:** When user asks for help on "the portal", "FMS", or anything DSC-related, this is the context. Mobile/tablet-friendly is essential — shop floor uses phones. Default to Supabase recommendation for backend (free tier, auth+DB+storage, photo upload for breakdown reports). Keep ko/en UI for managers but ensure shop-floor input forms render in en/ta.
