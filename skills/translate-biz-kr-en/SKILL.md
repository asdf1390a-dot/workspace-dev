---
name: translate-biz-kr-en
description: Translate and polish business content (emails, Excel, PowerPoint, plain text) between Korean and English for the DSC Mannur plant in Chennai. Use when the user shares content that needs to go from Korea HQ to India staff or vice versa, or when one side is drafting in a non-native language and wants tone/polish help. Triggers on words like "번역", "다듬어", "translate", "polish", "한↔영", "HQ", or when the user pastes Korean text asking for English equivalent (or vice versa).
---

# Korean ↔ English Business Bridge — DSC Mannur

User is Kyeongtae Na, a Korean GM at DSC Mannur (Chennai plant). He constantly bridges Korea HQ ↔ Indian plant staff. Apply plant context automatically; output is ready-to-send.

## Direction defaults

- **KR → EN**: audience is the Indian plant staff (engineers, operators, supervisors). Tone: professional, clear, direct, India-friendly. Avoid US slang. Plain professional English; British/Indian spelling if it flows naturally.
- **EN → KR**: audience is Korean HQ (parent company stakeholders). Tone: formal Korean business style (합니다/입니다 — 합쇼체), respectful, structured. Use 드리다/주시다 honorifics where the Korean reader expects them.

If direction is genuinely unclear, ask once. Otherwise infer from the source language.

## Plant context (always applies)

- **DSC** = Daechang Seat, automotive seat manufacturer. Mannur = Chennai plant location.
- Departments: 생산 (Production), 기술 (Engineering), 보전 (Maintenance, "BM" for breakdown), 생산관리 (PCC / Production Control), 금형 (Mould), 프레스 (Press), CCB.
- Production lines: FRAM, CCB, PRESS, PROJECTION. ~500 active machines + ~1500 jigs/moulds.
- Common parts: 시트백 프레임 = seat back frame, 헤드레스트 = head rest, 리클라이너 = recliner, 슬라이드 레일 = slide rail. Industry English is fine in either direction.

## Workflow

1. **Identify content type** (email body, Excel range/file, PPT slide text, plain text).
2. **Identify direction** from source language; confirm only if ambiguous.
3. **Translate with intent, not word-for-word.** Adjust register for receiving culture.
4. **Preserve verbatim**: part numbers, asset codes (e.g. `DCMI-UTL-PSF-01`), model names, dates, units, percentages.
5. **Output only the result.** No "Here's the translation:" preamble. No commentary unless something was genuinely ambiguous — then a single line at the end starting with "↳ Note:".

## Format-specific rules

### Email

- Subject line: keep concise. KR style often `[부서/안건] 제목`; mirror with EN brackets `[PRD]`, `[MAINT]`, `[QC]`, `[QA]`, etc.
- KR sign-off: `감사합니다.` / `잘 부탁드립니다.` / `확인 부탁드립니다.`
- EN sign-off: `Thanks,` / `Regards,` / `Best,` — match body formality.
- If the email asks for action or reports an incident, surface it at the top with `Action required:` or `긴급 조치 요청:` so it's not buried.

### Excel

- Translate **text cells only**. Never touch formulas, cell references, asset codes, or part numbers.
- Keep dates, numbers, and units (kg, mm, MPa, N·m, °C) in original form.
- For column headers and category labels, also return a small side-by-side glossary so the user can apply consistently to other sheets.
- **Round-trip (file in → file out):** if the user provides an `.xlsx` path, use the `xlsx` Node library — read, translate text cells in-place via the LLM, write to a new file with `_TR` suffix preserving the source structure. The xlsx lib is at `/tmp/xls-tmp/node_modules/xlsx` if not globally installed; clone the helper pattern from `db/import-jig-mould.mjs` in the DSC FMS portal repo.

### PowerPoint

- Translate slide text, speaker notes, and chart labels.
- Keep callouts short. Slides can't fit long sentences in either language.
- If text is pasted, return the translation in the same bullet/line structure as the original.
- **Round-trip (file in → file out)**: a `.pptx` is a zip archive with text in `ppt/slides/slide*.xml`. Read with `adm-zip` or unzip, translate text nodes (preserve XML structure), repack. This is more fragile than Excel — confirm the user wants round-trip before spending time on it.

### Plain text / chat / messaging

- Just translate. Match the source tone (urgent stays urgent, casual stays casual within professional bounds).
- For Slack/messenger excerpts, keep mentions (`@name`) and channel names as-is.

## What to NOT do

- Don't translate brand names, model names, part numbers, asset tags (`DCMI-*`), or established industry English (BM, PM, KPI, OEE, MTTR, MTBF, FIFO, FMEA).
- Don't romanize Korean unless explicitly asked. Hangul is fine for HQ.
- Don't soften urgent messages. If KR says `긴급`, EN says `Urgent`. Keep the heat.
- Don't add explanatory paragraphs after the translation. One-line `↳ Note:` at most, only when truly necessary.
- Don't auto-translate words the user explicitly tags with `[keep]` or `[do not translate]`.

## Glossary (apply consistently across sessions)

| Korean | English | Notes |
|---|---|---|
| 보전 / BM 이력 | Breakdown Maintenance / BM history | |
| 예방정비 / PM | Preventive Maintenance / PM | |
| 가동률 | Availability / Uptime rate | |
| 자산 코드 | Asset code | DCMI-prefixed tags are *asset numbers* |
| 라인 | Line | FRAM line, CCB line, etc. |
| 작업지시 | Work order / WO | |
| 부품 재고 | Parts inventory | |
| 사번 | Employee ID | |
| 본사 | HQ (head office) | |
| 현지 직원 | Local staff / On-site staff | |
| 신차 모델 | New model | (specific car model name stays verbatim) |
| 생산성 | Productivity / Production rate | context-dependent |
| 라인 정지 | Line down / Line stoppage | |
| 부적합 / 불량 | NG / Defect / Non-conforming | "NG" is widely used in plant English too |
| 안전 사고 | Safety incident | |

If a new term comes up repeatedly, add it here by editing this skill.

## Examples

**User pastes:**
> 생산 1라인 헤드레스트 용접 지그(DCMI-CWJ-15) 어제 야간 사이클 타임 3% 늘었어요. CO2 토치 가스 압력 확인 부탁합니다. 내일 오전까지 회신 주세요.

**Output:**
> Production Line 1 — head rest welding jig (DCMI-CWJ-15) showed a 3% cycle-time increase on yesterday's night shift. Please check CO2 torch gas pressure. Reply needed by tomorrow morning.

**User pastes (EN → KR direction):**
> Hi Mr. Na, the press line had two minor breakdowns this morning, both on hydraulic pump. Spare delivery from supplier is delayed by 2 days. Production target may slip 5%.

**Output:**
> 안녕하세요, 나 부장님. 오늘 오전 프레스 라인에서 유압 펌프 관련 경미 고장이 2건 발생했습니다. 협력사 예비 부품 입고가 2일 지연되어, 생산 목표 대비 5% 미달 가능성이 있습니다.

## When to extend

If the user uses this skill 5+ times and repeatedly corrects the same word or tone, ask if the glossary should be updated. Then update this file.
