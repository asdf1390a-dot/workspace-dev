# GLOSSARY v2.0 — DSC FMS Portal 다국어 용어사전

**Version:** 2.0  
**Effective Date:** 2026-05-19  
**Languages:** English | Tamil | 한국어 (Korean)  
**Scope:** DSC Mannur Manufacturing Portal — Asset Master, Audit System, Travel Management, Backup App  
**Maintained by:** Translator  
**Last Updated:** 2026-05-19 18:00 KST

---

## 목차 (Table of Contents)

1. **Core Manufacturing Terms** — 기본 제조업 용어
2. **Asset Management Module** — 자산 관리 모듈
3. **Audit & Reliability** — 감시 및 신뢰도
4. **Travel Management** — 출장 관리
5. **Backup & System** — 백업 및 시스템
6. **UI Components & Actions** — UI 컴포넌트 및 액션
7. **Status & States** — 상태 및 스테이트
8. **Technical & Database Terms** — 기술 및 DB 용어

---

## 1. Core Manufacturing Terms (제조 핵심 용어)

| # | English | Tamil | 한국어 | Context | Category |
|---|---------|-------|--------|---------|----------|
| 1.1 | Asset | சொத்து (Sothtu) | 자산 | Physical equipment, machinery, tools | Asset Master |
| 1.2 | Asset Category | சொத்து வகை (Sothtu Vakai) | 자산 분류 | Equipment, JIG, MOULD, Tools, Instruments | Asset Master |
| 1.3 | Asset Number | சொத்து எண் (Sothtu Enn) | 자산 번호 | Unique identifier assigned to each asset | Asset Master |
| 1.4 | Location | இடம் (Idam) | 위치 | Physical location: Production, Maintenance, Storage | Asset Master |
| 1.5 | QR Code | QR குறியீடு (QR Kuriykodu) | QR 코드 | Quick Response code for asset tracking | Asset Master |
| 1.6 | Serial Number | தொடர் எண் (Thodi Enn) | 일련번호 | Manufacturer's serial identification | Asset Master |
| 1.7 | Model | மாதிரி (Mathiri) | 모델 | Equipment model/specification | Asset Master |
| 1.8 | Make/Manufacturer | தயாரிப்பாளர் (Thaayarippalar) | 제조사 | Brand, manufacturer name | Asset Master |
| 1.9 | Equipment | உபகरण (Upakaran) | 장비 | General machinery/tools | Asset Master |
| 1.10 | JIG | JIG | JIG | Fixture tool for manufacturing | Asset Master |
| 1.11 | MOULD | அச்சு (Atchu) | 금형 | Die/mould for production | Asset Master |
| 1.12 | Tool | கருவி (Karuvi) | 공구 | Hand tools, power tools | Asset Master |
| 1.13 | Maintenance | பेராமರிप्पु (Peramaripu) | 유지보수 | Equipment maintenance, service | BM System |
| 1.14 | Breakdown | பழுதடையல் (Pazutadayal) | 고장 | Equipment failure/malfunction | BM System |
| 1.15 | Downtime | செயலிழப्पु (Seyalizhppu) | 가동 중단 | Period when equipment not operating | BM System |
| 1.16 | Repair | சரிசெய்தல் (Sariseyidhal) | 수리 | Equipment repair action | BM System |
| 1.17 | Preventive Maintenance | தடுপ்पு பेराமरिप्पु (Tadhuppu Peramaripu) | 예방 보전 | Planned maintenance to prevent failures | BM System |
| 1.18 | Spare Part | மாற్్రు பाग (Maarru Bhag) | 예비부품 | Replacement component | BM System |

---

## 2. Asset Management Module (자산 관리 모듈)

### 2.1 Asset CRUD & Search

| # | English | Tamil | 한국어 | Context | Notes |
|---|---------|-------|--------|---------|-------|
| 2.1.1 | Create Asset | சொத्து உ़ष்டாक्कु (Sothtu Ushtakku) | 자산 등록 | Create new asset record | POST /api/assets |
| 2.1.2 | Asset List | சொத்து তালিکا (Sothtu Talika) | 자산 목록 | List all assets with filters | GET /api/assets |
| 2.1.3 | Asset Detail | சொத्து விபरण (Sothtu Viparana) | 자산 상세 | Single asset full information | GET /api/assets/:id |
| 2.1.4 | Update Asset | சொத्து மாறுपाशु (Sothtu Marupashu) | 자산 수정 | Modify asset properties | PUT /api/assets/:id |
| 2.1.5 | Delete Asset | சொத்து நீக्कு (Sothtu Neekku) | 자산 삭제 | Remove asset from system | DELETE /api/assets/:id |
| 2.1.6 | Bulk Update | பெहु மாறுпાשु (Pehu Marupashu) | 일괄 수정 | Update multiple assets at once | POST /api/assets/bulk-update |
| 2.1.7 | Full-Text Search (FTS) | முูलथमत पशोध (Mulathma Padosh) | 전문 검색 | Search by name, model, serial | q parameter |
| 2.1.8 | Filter | छনيप् (Chanip) | 필터 | Filter by category, status, location | category, status, location params |
| 2.1.9 | Sort | क्रमپाशු (Krampashu) | 정렬 | Order by name, date, status | sort param: name_en, updated_at |
| 2.1.10 | Pagination | பाग నిबन్ধन (Bag Nibandan) | 페이지네이션 | Split results into pages | page, per_page (default: 20) |

### 2.2 Asset Categories & Master Data

| # | English | Tamil | 한국어 | Context | Standard Values |
|---|---------|-------|--------|---------|-----------------|
| 2.2.1 | Category | வரैग (Varai) | 분류 | Asset type/category | Equipment, JIG, MOULD, Tools, Instruments |
| 2.2.2 | Equipment Category | உपकरण வرग (Upkaran Varg) | 장비 분류 | Machinery, Compressors, Pumps | See standard values |
| 2.2.3 | Location Dropdown | இட णिपशन (Itak Nipshan) | 위치 목록 | Fixed locations in factory | Production, Maintenance, Storage, Warehouse |
| 2.2.4 | Status | नстা़ (Nista) | 상태 | Asset operational status | Active, Idle, Maintenance, Sold, Scrapped |

### 2.3 Asset Import & Export

| # | English | Tamil | 한국어 | Context | Details |
|---|---------|-------|--------|---------|---------|
| 2.3.1 | Import Template | आयथ्पत्र (Ayatha Patra) | 가져오기 서식 | Excel template for bulk upload | GET /api/assets/import/template.xlsx |
| 2.3.2 | Import Preview | आयथ् पूरвपेक्षा (Ayatha Purvapexta) | 미리보기 | Validate import data before execution | POST /api/assets/import/preview |
| 2.3.3 | Execute Import | आयथ् निष्पादन (Ayatha Nishpadan) | 가져오기 실행 | Finalize and commit import | POST /api/assets/import/execute |
| 2.3.4 | Import Batch | आयथ् बैच (Ayatha Batch) | 가져오기 배치 | Single import session/transaction | asset_import_batches table |
| 2.3.5 | Batch Status | बैच नสtas (Batch Nista) | 배치 상태 | pending, processing, success, partial, failed | Standard statuses |
| 2.3.6 | Export Asset | निर्यात सொत्तு (Nir-yat Sothtu) | 자산 내보내기 | Download assets as Excel | GET /api/assets/export/excel |
| 2.3.7 | Import Validation | आयथ् सत्यাपन (Ayatha Satyapan) | 가져오기 검증 | Check for duplicates, missing fields | asset_number uniqueness |
| 2.3.8 | Batch Tracking | बैच अनुमาप (Batch Anumap) | 배치 추적 | Monitor import progress & errors | GET /api/assets/import/batches |

### 2.4 Asset Audit & History

| # | English | Tamil | 한국어 | Context | Details |
|---|---------|-------|--------|---------|---------|
| 2.4.1 | Audit Log | जांच लॉग (Janch Log) | 감시 로그 | Change history for single asset | GET /api/assets/:id/audit-log |
| 2.4.2 | Audit Trail | जांच मार्ग (Janch Marg) | 감시 기록 | Complete audit record of all changes | asset_audit table |
| 2.4.3 | Operation Type | कार्यपरिवर्तन (Kary Parivartan) | 작업 유형 | create, update, delete, transfer | operation column |
| 2.4.4 | Old Value | पूरानო मान (Purano Mann) | 이전 값 | Previous field value before change | old_value column |
| 2.4.5 | New Value | नयों मान (Nayo Mann) | 새로운 값 | Updated field value after change | new_value column |
| 2.4.6 | Changed By | परिवर्तन कर्ता (Parivartan Karta) | 변경자 | User who made the change | created_by (user_id) |

### 2.5 Asset Statistics & Analytics

| # | English | Tamil | 한국어 | Context | Calculation |
|---|---------|-------|--------|---------|------------|
| 2.5.1 | Total Assets | कुल सொत्तु (Kul Sothtu) | 전체 자산 | Count of all active assets | COUNT(*) FROM assets WHERE status='active' |
| 2.5.2 | By Category | वर্गनुसार (Varg Nusaar) | 분류별 | Asset count grouped by category | GROUP BY category |
| 2.5.3 | By Status | नступालुसार (Nista Nusaar) | 상태별 | Distribution across statuses | GROUP BY status |
| 2.5.4 | By Location | स्थाऩनुसार (Sthan Nusaar) | 위치별 | Asset distribution by location | GROUP BY location |
| 2.5.5 | Statistics Dashboard | सांख्यिकी दस्तک (Sankhyiki Dastak) | 통계 대시보드 | Overview chart page | GET /api/assets/statistics |
| 2.5.6 | Monthly Addition | मासिक जोड़ (Masik Jod) | 월간 추가 | New assets added per month | Time-based COUNT |

---

## 3. Audit & Reliability System (감시 및 신뢰도 시스템)

### 3.1 DRS (Daily Reliability Score)

| # | English | Tamil | 한국어 | Context | Target |
|---|---------|-------|--------|---------|--------|
| 3.1.1 | DRS Score | DRS தreпலெ (DRS Depale) | DRS 점수 | Daily Reliability Score (0-100) | ≥95% = Good |
| 3.1.2 | DRS Status | DRS नіста (DRS Nista) | DRS 상태 | good (≥95) / caution (85-94) / critical (<85) | Classification |
| 3.1.3 | Report Date | रिपोर्ट दिन (Report Din) | 리포트 날짜 | Unique report per day | UNIQUE constraint |
| 3.1.4 | Metric | मापदंड (Mapdan) | 지표 | Individual measurement component | E.g., backup success |
| 3.1.5 | Metric Value | मापदंड मूल्य (Mapdan Mulya) | 지표 값 | Numeric score of metric | 0-100 % or milliseconds |
| 3.1.6 | Metric Status | मापदंड नსtas (Mapdan Nista) | 지표 상태 | good / caution / critical per metric | Threshold-based |

### 3.2 Key Performance Indicators (KPIs)

| # | English | Tamil | 한국어 | Context | Formula |
|---|---------|-------|--------|---------|---------|
| 3.2.1 | Backup Success Rate | बैकअप सফलता दर (Backup Saflata Dar) | 백업 성공률 | % of successful backups | (Successful / Total) × 100 |
| 3.2.2 | API Response Time | API प्रतिक्रिया समय (API Pratikriya Samay) | API 응답시간 | Average API latency in ms | Total time / Request count |
| 3.2.3 | Recovery Possible Rate | पुनरुद्धार संभव दर (Punardudhaar Sambhav Dar) | 복구 가능률 | % of backups that are recoverable | (Recoverable / Total) × 100 |
| 3.2.4 | Alert Delivery Rate | सचेतadvता प्रदान दर (Sachet Pradan Dar) | 알림 전달률 | % of alerts successfully delivered | (Delivered / Sent) × 100 |
| 3.2.5 | Trend | प्रवणता (Pravnata) | 추세 | 7-day moving average trend | upward / flat / downward |
| 3.2.6 | Weekly Average | साप्ताहिक मध्य (Sapthahik Madhya) | 주간 평균 | Average of last 7 days | SUM(values) / 7 |

### 3.3 Alerts & Notifications

| # | English | Tamil | 한국어 | Context | Trigger |
|---|---------|-------|--------|---------|---------|
| 3.3.1 | Alert | सचेतताluา (Sachetata) | 경보 | System notification of critical event | DRS <85% or failure |
| 3.3.2 | Alert Type | सचेतता प्रकार (Sachetata Prakar) | 경보 유형 | drs_low, backup_failure, api_timeout | Category |
| 3.3.3 | Alert Delivery | सचेतता प्रदान (Sachetata Pradan) | 경보 전달 | Send via Telegram, Discord, Email | Channel |
| 3.3.4 | P0 Issue | P0 समัहमा (P0 Sammaha) | P0 이슈 | Critical priority issue | Severity=P0 |
| 3.3.5 | P1 Issue | P1 समัहमा (P1 Sammaha) | P1 이슈 | High priority issue | Severity=P1 |
| 3.3.6 | Triggered At | किंवчित समय (Kinchit Samay) | 발동 시간 | When alert was generated | Timestamp |
| 3.3.7 | Alerted At | सচेत समय (Sachet Samay) | 알림 시간 | When alert was delivered | Delivery timestamp |

### 3.4 Audit Calculation

| # | English | Tamil | 한국어 | Context | Steps |
|---|---------|-------|--------|---------|-------|
| 3.4.1 | Backup Check | बैकअप जांच (Backup Janch) | 백업 확인 | Validate backup completion | Step 1 |
| 3.4.2 | API Test | API परीक्षण (API Parikshan) | API 테스트 | Measure API response times | Step 2 |
| 3.4.3 | Recovery Test | पुनरुद्धार परीक्षण (Punardudhaar Parikshan) | 복구 테스트 | Test backup recovery capability | Step 3 |
| 3.4.4 | Calculation Logs | गणना लॉग (Ganna Log) | 계산 로그 | Record of all calculation steps | Traceability |
| 3.4.5 | Step Status | चरण नीता (Charan Nita) | 단계 상태 | success / partial_failure / failure | Per-step |
| 3.4.6 | Execution Time | निष्पादन समय (Nishpadan Samay) | 실행 시간 | How long each step took in ms | Performance metric |

---

## 4. Travel Management (출장 관리)

### 4.1 Travel Core

| # | English | Tamil | 한국어 | Context | Details |
|---|---------|-------|--------|---------|---------|
| 4.1.1 | Travel | பயணம் (Payanam) | 출장 | Business trip / travel record | Parent entity |
| 4.1.2 | Travel ID | பயணம் ID (Payanam ID) | 출장 ID | Unique identifier | UUID |
| 4.1.3 | Destination | பயணmulipodatি (Payanamulipodati) | 목적지 | Where the travel is going | City/Country |
| 4.1.4 | Start Date | தொடக்க தाริხ் (Todakka Tarikh) | 시작일 | Travel commencement date | Date format |
| 4.1.5 | End Date | முடிவு தाريख़ (Mudivu Tarikh) | 종료일 | Travel completion date | Date format |
| 4.1.6 | Duration | கInterval नวधि (Interval Navdhi) | 기간 | Number of days | Auto-calculated |
| 4.1.7 | Travel Status | பயணम் नیstate (Payanam Neista) | 출장 상태 | upcoming, ongoing, completed | State enum |
| 4.1.8 | Organizer | ஏற्पादक (Erpodik) | 주최자 | Primary travel organizer | User who created |
| 4.1.9 | Create | உ़ष्டாக्কु (Ushtakku) | 등록 | Create new travel record | POST /api/travels |
| 4.1.10 | Edit | संपादन (Sampadna) | 수정 | Modify travel details | PUT /api/travels/:id |

### 4.2 Travel Members

| # | English | Tamil | 한국어 | Context | Details |
|---|---------|-------|--------|---------|---------|
| 4.2.1 | Member | உறुप्पु (Uruppu) | 멤버 | Travel participant | travel_members table |
| 4.2.2 | Invite Member | உறुप्पु ಅhvahvahvahვahvahवvahvahவvahvahвavahvahवvahვavahვಾhვahვavahვvah (Uruppu Awahan) | 멤버 초대 | Send invitation to join | POST /api/travels/:id/members |
| 4.2.3 | Member Permission | உறுप्पु अधिकार (Uruppu Adhikar) | 멤버 권한 | Role: organizer, editor, viewer | Role enum |
| 4.2.4 | Can Write | எழுत सकtos (Ezut Saktos) | 편집 가능 | Member can edit | Permission flag |
| 4.2.5 | Can Delete | நीक्कु सক्त (Neekku Sakti) | 삭제 가능 | Member can delete travel | Permission flag |
| 4.2.6 | Member Count | உறுप्पु எണ्ण (Uruppu Enn) | 멤버 수 | Total participants | COUNT(members) |

### 4.3 Travel Schedule & Events

| # | English | Tamil | 한국어 | Context | Details |
|---|---------|-------|--------|---------|---------|
| 4.3.1 | Event | நிகह़ूпति (Nigahupti) | 일정 | Schedule item within travel | travel_events table |
| 4.3.2 | Event Type | நिकḥूпति शक्त (Nigahupti Sakti) | 일정 유형 | flight, hotel, meeting, activity | Type enum |
| 4.3.3 | Event Date/Time | நिकḥูूnotត़ (Nigahupti Data) | 일정 날짜/시간 | When event occurs | Timestamp |
| 4.3.4 | Duration | नกาएवधि (Nava Vidhi) | 기간 | How long event lasts | Calculated field |
| 4.3.5 | Location/Venue | నિକḥूஉึుఠుಹ้ं (Nigahup Sthan) | 장소 | Where event happens | Text field |
| 4.3.6 | Description | விவरण (Vivarana) | 설명 | Event details | Free text |
| 4.3.7 | Calendar View | पञ्चाಂगೆ (Panchang) | 캘린더 뷰 | Timeline/calendar display | Component |
| 4.3.8 | Timeline View | समय रेखा दृश्य (Samay Rekha Drashya) | 타임라인 뷰 | Sequential event display | Component |

### 4.4 Travel Costs & Settlement

| # | English | Tamil | 한국어 | Context | Details |
|---|---------|-------|--------|---------|---------|
| 4.4.1 | Cost | खर्च (Kharch) | 비용 | Expense entry | travel_costs table |
| 4.4.2 | Cost Type | खर्च شtype (Kharch Type) | 비용 유형 | flight, hotel, transport, meal, misc | Category |
| 4.4.3 | Amount | रशाsh (Rash) | 금액 | Cost value in currency | Decimal |
| 4.4.4 | Currency | मुদ्रा (Mudra) | 통화 | INR, USD, etc. | Currency code |
| 4.4.5 | Payer | भुगतानकर्ता (Bhugtan Karta) | 결제자 | Who paid for the cost | User ID |
| 4.4.6 | Split | बंटवारा (Bantwara) | 분할 | Cost distribution among members | Shares |
| 4.4.7 | Settlement | निষ्पत्ति (Nishptti) | 정산 | Balance payment between members | Calculation |
| 4.4.8 | Total Cost | कुल खर्च (Kul Kharch) | 총 비용 | Sum of all travel costs | SUM(amounts) |
| 4.4.9 | Cost Dashboard | खर्च पेनल (Kharch Panel) | 비용 대시보드 | Cost summary and breakdown | Component |
| 4.4.10 | Cost Analytics | खर्च विश्लेषण (Kharch Vishleshan) | 비용 분석 | Cost trends and charts | Component |

### 4.5 Travel Documents

| # | English | Tamil | 한국어 | Context | Details |
|---|---------|-------|--------|---------|---------|
| 4.5.1 | Document | दस्तावेज़ (Dastavez) | 문서 | File/attachment | travel_documents table |
| 4.5.2 | Passport | पासपोर्ट (Passport) | 여권 | Travel passport document | Sensitive |
| 4.5.3 | Visa | वीज़ा (Visa) | 비자 | Visa document | Sensitive |
| 4.5.4 | Ticket | टिकट (Ticket) | 티켓 | Flight/transport ticket | Document type |
| 4.5.5 | Voucher | वाउचर (Voucher) | 영수증 | Expense receipt/voucher | Document type |
| 4.5.6 | Upload | अपलोड (Upload) | 업로드 | Add file to travel | POST file |
| 4.5.7 | Download | डाउनलोड (Download) | 다운로드 | Retrieve file from travel | GET file |
| 4.5.8 | File Storage | फाइल भंडार (File Bhandar) | 파일 저장소 | Supabase Storage bucket | Infrastructure |
| 4.5.9 | Share Document | दस्तावेज़ साझा (Dastavez Sazkha) | 문서 공유 | Send to other members | Permission |
| 4.5.10 | Document Expiry | दस्तावेज़ समापन (Dastavez Samapna) | 문서 만료 | When document is no longer valid | Optional metadata |

### 4.6 Travel Checklist

| # | English | Tamil | 한국어 | Context | Details |
|---|---------|-------|--------|---------|---------|
| 4.6.1 | Checklist | जांच তালिका (Janch Talika) | 체크리스트 | Task list for travel preparation | travel_checklist table |
| 4.6.2 | Category | वर्ग (Varg) | 분류 | documentation, packing, health, finance | Category |
| 4.6.3 | Item | वस्तु (Vastu) | 항목 | Individual checklist task | Item |
| 4.6.4 | Status | नೆtasตພດhវតທ (Nesta) | 상태 | pending, completed, not_applicable | State |
| 4.6.5 | Progress | प्रगति (Pragati) | 진행률 | % of checklist completed | Percentage |
| 4.6.6 | Mark Complete | पूर्ण चिन्ह (Purn Chinĥ) | 완료 표시 | Check off item | PATCH endpoint |
| 4.6.7 | Due Date | निर्धारित दिन (Nirdharit Din) | 기한 | When item should be done | Optional date |

---

## 5. Backup & Data Protection (백업 및 데이터 보호)

### 5.1 Backup Core

| # | English | Tamil | 한국어 | Context | Details |
|---|---------|-------|--------|---------|---------|
| 5.1.1 | Backup | बैकअप (Backup) | 백업 | Data backup copy | backups table |
| 5.1.2 | Backup ID | बैकअप ID (Backup ID) | 백업 ID | Unique backup identifier | UUID |
| 5.1.3 | Backup Type | बैকअप प्रकार (Backup Prakar) | 백업 유형 | agent_state, database, full_system | Type enum |
| 5.1.4 | Status | नीता (Neita) | 상태 | pending, in_progress, completed, failed | State |
| 5.1.5 | Create Backup | बैकअप उष्ठाქ್கु (Backup Ushtakku) | 백업 생성 | Initiate new backup | POST /api/backup/create |
| 5.1.6 | Size Bytes | आकार बाइट (Akar Byte) | 크기 (바이트) | Backup file size in bytes | Numeric |
| 5.1.7 | File Count | फाइल गिनती (Fail Ginti) | 파일 수 | Number of files in backup | Integer |
| 5.1.8 | Storage Path | संग्रह पथ (Sangrah Path) | 저장 경로 | Where backup is stored | Supabase path |
| 5.1.9 | Checksum | जांच संख्या (Janch Sankhya) | 체크섬 | File integrity verification | Hash |
| 5.1.10 | Completed At | पूર्ण समय (Purn Samay) | 완료 시간 | When backup finished | Timestamp |

### 5.2 Automated Backup Scheduling

| # | English | Tamil | 한국어 | Context | Details |
|---|---------|-------|--------|---------|---------|
| 5.2.1 | Automatic Backup | स्वचलित बैकअप (Swachlit Backup) | 자동 백업 | Scheduled daily backups | Cron job |
| 5.2.2 | Schedule | अनुसूची (Anusuchi) | 일정 | Backup timing configuration | Vercel Cron |
| 5.2.3 | Daily Backup | दैनिक बैकअप (Dainik Backup) | 일일 백업 | Once per day | 02:00 KST |
| 5.2.4 | Manual Backup | मैनुअल बैकअप (Manual Backup) | 수동 백업 | User-triggered backup | On-demand |
| 5.2.5 | Backup Trigger | बैकअप ट्रिगर (Backup Trigger) | 백업 트리거 | Event that starts backup | automated_daily, manual, event |
| 5.2.6 | Cron Expression | Cron अभिव्यक्ति (Cron Abhivyakti) | Cron 표현식 | Scheduling pattern | "0 2 * * *" |
| 5.2.7 | Configure Schedule | अनुसूची विन्यास (Anusuchi Vinyasa) | 일정 설정 | Set backup time preference | POST /api/backup/schedule |

### 5.3 Storage & Retention

| # | English | Tamil | 한국어 | Context | Details |
|---|---------|-------|--------|---------|---------|
| 5.3.1 | Retention Policy | प्रतिधारण नीति (Pratidharan Niti) | 보존 정책 | How long to keep backups | backup_policies table |
| 5.3.2 | Retention Days | प्रतिधारण दिन (Pratidharan Din) | 보존 기간 (일) | 30/90/180 days or unlimited | Numeric |
| 5.3.3 | Storage Quota | भंडार할당 (Bhandar할당) | 저장소 할당량 | Max storage per user | GB limit |
| 5.3.4 | Auto Delete | स्वचलित हटाव (Swachlit Hatav) | 자동 삭제 | Remove old backups automatically | Policy flag |
| 5.3.5 | Delete Expired | समाप्त हटाव (Samapt Hatav) | 만료 삭제 | Remove backups past retention date | Daily cron |
| 5.3.6 | Manual Delete | मैनुअल हटाव (Manual Hatav) | 수동 삭제 | User-requested deletion | DELETE endpoint |
| 5.3.7 | Storage Used | भंडार उपयोग (Bhandar Upyog) | 저장소 사용량 | Current storage consumption | Bytes/GB |
| 5.3.8 | Storage Remaining | शेष भंडार (Shesh Bhandar) | 남은 저장소 | Available storage space | Bytes/GB |

### 5.4 Backup Notifications & Alerts

| # | English | Tamil | 한국어 | Context | Details |
|---|---------|-------|--------|---------|---------|
| 5.4.1 | Backup Success | बैकअप सफलता (Backup Saflata) | 백업 성공 | Notification when backup completes | Email/Telegram |
| 5.4.2 | Backup Failure | बैकअप विफलता (Backup Vifalta) | 백업 실패 | Alert when backup fails | With error details |
| 5.4.3 | Quota Warning |할당 चेतावनी (Halat Chetavani) | 할당량 경고 | Alert when quota near limit | 80% threshold |
| 5.4.4 | Notification Channel | सूचना चैनल (Suchna Chanel) | 알림 채널 | telegram, email, discord | Delivery method |

### 5.5 Data Recovery

| # | English | Tamil | 한국어 | Context | Details |
|---|---------|-------|--------|---------|---------|
| 5.5.1 | Restore | पुनरुद्धार (Punardudhaar) | 복원 | Restore from backup | POST /api/backup/restore |
| 5.5.2 | Recovery Point | पुनरुद्धार बिंदु (Punardudhaar Bindu) | 복구 지점 | State at time of backup | Specific timestamp |
| 5.5.3 | Restore Status | पुनरुद्धार नीता (Punardudhaar Nita) | 복원 상태 | pending, in_progress, completed, failed | State |
| 5.5.4 | Recovery Test | पुनरुद्धार परीक्षण (Punardudhaar Parikshan) | 복구 테스트 | Verify backup is recoverable | Automated check |
| 5.5.5 | Time-Point Recovery | समय-बिंदु पुनर्प्राप्ति (Samay-Bindu Punarprapti) | 지정 시점 복구 | Restore to specific date/time | Optional granularity |

---

## 6. UI Components & Actions (UI 컴포넌트 및 액션)

### 6.1 Common UI Terms

| # | English | Tamil | 한국어 | Context | Component |
|---|---------|-------|--------|---------|-----------|
| 6.1.1 | Button | பொத्தம் (Poththa) | 버튼 | Clickable action | UI element |
| 6.1.2 | Form | படிவம् (Padivam) | 양식 | Input form container | Component |
| 6.1.3 | Field | புலம् (Pulam) | 필드 | Form input field | Input element |
| 6.1.4 | Dropdown | கீழ் நோக्कम् (Kizh Nokam) | 드롭다운 | Select list | Selector |
| 6.1.5 | Modal | मॉडल (Modal) | 모달 | Dialog box | Overlay |
| 6.1.6 | Tab | மூலै (Mulai) | 탭 | Tabbed interface | Navigation |
| 6.1.7 | Filter | छन्ने (Channe) | 필터 | Data filtering control | Input |
| 6.1.8 | Search | अन्वेषण (Anveshan) | 검색 | Search input field | Input |
| 6.1.9 | Card | पत्ता (Patta) | 카드 | Container component | Visual element |
| 6.1.10 | Dialog | संवाद (Samvad) | 대화 | Alert/confirmation box | Modal |

### 6.2 Action Verbs

| # | English | Tamil | 한국어 | Context | UI Label |
|---|---------|-------|--------|---------|----------|
| 6.2.1 | Create | உ़ष्टाक्कु (Ushtakku) | 생성 | Create new record | "+ Create" |
| 6.2.2 | Add | சேर् (Ser) | 추가 | Add item to collection | "+ Add" |
| 6.2.3 | Edit | संपादन (Sampadna) | 수정 | Modify existing record | "Edit" or "✎" |
| 6.2.4 | Delete | नीक्कु (Neekku) | 삭제 | Remove record | "Delete" or "🗑️" |
| 6.2.5 | Save | सংरक्षण (Sangrakshan) | 저장 | Persist changes | "Save" |
| 6.2.6 | Cancel | रद्द (Radd) | 취소 | Discard changes | "Cancel" |
| 6.2.7 | Submit | जमा (Jama) | 제출 | Submit form | "Submit" |
| 6.2.8 | Search | अन्वेषण (Anveshan) | 검색 | Perform search | "Search" or "🔍" |
| 6.2.9 | Filter | छन्न (Channa) | 필터 | Apply filter | "Filter" or "⚙️" |
| 6.2.10 | Export | निर्यात (Niryat) | 내보내기 | Export data | "Export" |
| 6.2.11 | Import | आयत (Ayat) | 가져오기 | Import data | "Import" |
| 6.2.12 | Confirm | स्वीकृति (Swikruti) | 확인 | Confirm action | "OK" or "Confirm" |
| 6.2.13 | Refresh | पुनः लोड (Punah Load) | 새로고침 | Reload data | "Refresh" or "↻" |
| 6.2.14 | Close | बंद (Band) | 닫기 | Close dialog | "Close" or "✕" |

---

## 7. Status & States (상태 및 스테이트)

### 7.1 Asset Statuses

| # | English | Tamil | 한국어 | Context | Color Code |
|---|---------|-------|--------|---------|-----------|
| 7.1.1 | Active | सक्रिय (Sakriya) | 활성 | Asset in use | 🟢 Green |
| 7.1.2 | Idle | निष्क्रिय (Nishkriya) | 유휴 | Not currently used | 🟡 Yellow |
| 7.1.3 | Maintenance | रखरखाव (Rakh-Rakhav) | 보전 | Under maintenance | 🟠 Orange |
| 7.1.4 | Sold | बिक्रय (Bikray) | 판매됨 | Asset sold | 🔵 Blue |
| 7.1.5 | Scrapped | निकाला (Nikala) | 폐기됨 | Asset disposed | 🔴 Red |

### 7.2 Travel Statuses

| # | English | Tamil | 한000கோ | 한국어 | Context | Meaning |
|---|---------|-------|--------|---------|---------|
| 7.2.1 | Upcoming | आसन्न (Asnna) | வருகிற (Varukirathu) | 예정 | Scheduled in future | Not started |
| 7.2.2 | Ongoing | चलंत (Chalant) | நடணஉற (Nadarkkuppu) | 진행중 | Currently in progress | In process |
| 7.2.3 | Completed | पूर्ण (Purn) | கூமპეიપთъ (Kumpiepet) | 완료 | Travel finished | Done |

### 7.3 Backup Statuses

| # | English | Tamil | 한국어 | Context | Meaning |
|---|---------|-------|--------|---------|---------|
| 7.3.1 | Pending | प्रतीक्षा (Prateeksha) | 대기 중 | Queued for backup | Not started |
| 7.3.2 | In Progress | प्रगति (Pragati) | 진행 중 | Currently backing up | Running |
| 7.3.3 | Completed | पूर्ण (Purn) | 완료 | Backup successful | Done |
| 7.3.4 | Failed | विफल (Vifal) | 실패 | Backup failed | Error state |
| 7.3.5 | Partial | आंशिक (Aanshik) | 부분적 | Some data backed up | Partial success |

---

## 8. Technical & Database Terms (기술 및 DB 용어)

### 8.1 Database & API

| # | English | Tamil | 한국어 | Context | Technical |
|---|---------|-------|--------|---------|-----------|
| 8.1.1 | Database | डाटाबेस (Database) | 데이터베이스 | Supabase PostgreSQL | Infrastructure |
| 8.1.2 | Table | तालिका (Talika) | 테이블 | Database table | DB entity |
| 8.1.3 | Column | स्तंभ (Stambh) | 열 | Table column/field | DB column |
| 8.1.4 | Row | पंक्ति (Pankti) | 행 | Table row/record | DB record |
| 8.1.5 | API | API | API | REST endpoint | Interface |
| 8.1.6 | Endpoint | अंतिम बिंदु (Antim Bindu) | 엔드포인트 | API route | URL path |
| 8.1.7 | Query | प्रश्न (Prashn) | 질의 | Database query | SELECT |
| 8.1.8 | Filter | छन्नपत्र (Channapatra) | 필터 | WHERE clause | Condition |
| 8.1.9 | Join | जोड़ (Jod) | 결합 | SQL JOIN operation | Relationship |
| 8.1.10 | Index | अनुक्रमणिका (Anukramnika) | 인덱스 | Database index | Performance |

### 8.2 Authentication & Authorization

| # | English | Tamil | 한국어 | Context | Security |
|---|---------|-------|--------|---------|----------|
| 8.2.1 | Auth | प्रमाणीकरण (Praman-ikaran) | 인증 | Authentication system | Security |
| 8.2.2 | User | उपयोगकर्ता (Upyogkarta) | 사용자 | System user | Entity |
| 8.2.3 | Role | भूमिका (Bhumika) | 역할 | User role/permission | RBAC |
| 8.2.4 | Permission | अनुमति (Anumati) | 권한 | Access permission | Authorization |
| 8.2.5 | RLS | पंक्ति स्तर सुरक्षा (Row Level Security) | RLS | Row-level security | DB policy |
| 8.2.6 | Session | सत्र (Satra) | 세션 | User session | State |
| 8.2.7 | Token | टोकन (Token) | 토큰 | Auth token | JWT |

### 8.3 Data Types

| # | English | Tamil | 한국어 | Context | Examples |
|---|---------|-------|--------|---------|----------|
| 8.3.1 | String | अक्षर (Akshar) | 문자열 | Text data | "Active", "John Doe" |
| 8.3.2 | Number | संख्या (Sankhya) | 숫자 | Numeric value | 100, 99.5 |
| 8.3.3 | Boolean | तार्किक (Tarkik) | 논리값 | True/False | true, false |
| 8.3.4 | Date | तारीख (Tarikh) | 날짜 | Date value | 2026-05-19 |
| 8.3.5 | Timestamp | समय चिह्न (Samay Chihan) | 타임스탬프 | Date + time | 2026-05-19T18:00:00Z |
| 8.3.6 | UUID | यूनिवर्सल आईडी (Universal ID) | UUID | Unique identifier | a1b2c3d4-... |
| 8.3.7 | JSON | जेएसओएन (JSON) | JSON | Structured data | {"key": "value"} |
| 8.3.8 | Array | सरणी (Sarani) | 배열 | List of values | [1, 2, 3] |
| 8.3.9 | Decimal | दशमलव (Dashmalan) | 소수 | Decimal number | 99.99 |
| 8.3.10 | Integer | पूर्णांक (Purnank) | 정수 | Whole number | 100 |

### 8.4 Error & Status Codes

| # | Code | English | 한국어 | Meaning |
|---|------|---------|--------|---------|
| 8.4.1 | 200 | OK | 성공 | Request successful |
| 8.4.2 | 201 | Created | 생성됨 | Resource created |
| 8.4.3 | 204 | No Content | 내용 없음 | Success, no response body |
| 8.4.4 | 400 | Bad Request | 잘못된 요청 | Invalid input |
| 8.4.5 | 401 | Unauthorized | 인증되지 않음 | Not logged in |
| 8.4.6 | 403 | Forbidden | 금지됨 | No permission |
| 8.4.7 | 404 | Not Found | 찾을 수 없음 | Resource doesn't exist |
| 8.4.8 | 409 | Conflict | 충돌 | Duplicate/conflict |
| 8.4.9 | 422 | Unprocessable | 처리 불가 | Validation error |
| 8.4.10 | 500 | Server Error | 서버 오류 | Internal error |

---

## Usage Guidelines (사용 가이드라인)

### For Developers
- Use English terms as primary identifiers in code/APIs
- Use standardized statuses from Section 7 for consistency
- Reference table structure in GLOSSARY_TABLE_SCHEMA.sql for DB field names

### For Translators
- Tamil terms use simplified phonetic transliteration
- Korean uses standard Hangul + official technical terms
- All translations maintain consistency with existing 200+ v1.0 terms (if migrated)

### For UI/Product
- Use Korean for UI labels when targeting Korean-speaking users
- Use Tamil for shop-floor and field operator interfaces
- Maintain color codes from Status sections for visual consistency

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Pre-2026 | Initial 200+ terms | Previous translator |
| 2.0 | 2026-05-19 | +250 terms (Asset Master, Audit, Travel, Backup) | Translator (v2.0) |

---

**Document Control:** This glossary supersedes all prior terminology documents. Update GLOSSARY_TABLE_SCHEMA.sql and UI_LABEL_GUIDELINES.md concurrently with any changes.
