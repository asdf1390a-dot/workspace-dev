-- GLOSSARY_TABLE_SCHEMA.sql
-- DSC FMS Portal v2.0 Multi-Language Glossary Storage
-- PostgreSQL + Supabase
-- Created: 2026-05-19
-- Author: Translator
-- Purpose: Centralized glossary management for English | Tamil | Korean translations

-- =====================================================
-- 1. MAIN GLOSSARY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS glossary_entries (
    id BIGSERIAL PRIMARY KEY,

    -- Core Terminology
    term_id VARCHAR(50) UNIQUE NOT NULL,  -- Format: "1.1", "2.3.5", etc.
    term_english VARCHAR(255) NOT NULL,   -- Primary English term
    term_tamil VARCHAR(500),              -- Tamil transliteration/script
    term_korean VARCHAR(255),             -- Korean hangul term

    -- Categorization
    module_category VARCHAR(100) NOT NULL, -- Asset, Audit, Travel, Backup, Core, UI, Status, Technical
    subcategory VARCHAR(100),              -- e.g., "CRUD & Search", "Import & Export"
    term_type VARCHAR(50),                 -- noun, verb, adjective, status, action, technical

    -- Context & Usage
    context_english TEXT,                 -- Usage context in English
    context_tamil TEXT,                   -- Tamil context/example
    context_korean TEXT,                  -- Korean context/example
    usage_notes TEXT,                     -- Additional usage guidelines

    -- Standard Values (for dropdowns, status fields)
    standard_values TEXT[],               -- Array of allowed values for this term

    -- Related Information
    api_endpoint VARCHAR(255),            -- Associated API if applicable
    database_table VARCHAR(100),          -- Associated DB table if applicable
    ui_component VARCHAR(100),            -- Associated UI component (Button, Label, etc.)

    -- Status & Metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'archived')),
    version_number INTEGER DEFAULT 1,     -- Track terminology version changes
    is_required_field BOOLEAN DEFAULT FALSE, -- Indicates if this term is for required UI fields

    -- Audit Trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(100),              -- User/role who created this entry
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(100),              -- User/role who last updated
    deprecated_at TIMESTAMP WITH TIME ZONE,
    deprecated_reason VARCHAR(500),

    -- Validation & Completeness
    is_complete BOOLEAN DEFAULT FALSE,    -- All three languages filled
    has_standard_values BOOLEAN DEFAULT FALSE,
    has_api_reference BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_glossary_term_english
    ON glossary_entries(term_english);

CREATE INDEX idx_glossary_term_id
    ON glossary_entries(term_id);

CREATE INDEX idx_glossary_module_category
    ON glossary_entries(module_category);

CREATE INDEX idx_glossary_status
    ON glossary_entries(status);

CREATE INDEX idx_glossary_term_type
    ON glossary_entries(term_type);

-- Full-Text Search Index (English + Tamil + Korean combined)
CREATE INDEX idx_glossary_fts
    ON glossary_entries USING GIN (
        to_tsvector('english', COALESCE(term_english, '') || ' ' ||
                              COALESCE(context_english, ''))
    );

-- =====================================================
-- 3. GLOSSARY_TERMS_RELATIONSHIPS TABLE
-- =====================================================
-- Links related terms (synonyms, antonyms, hierarchical relationships)

CREATE TABLE IF NOT EXISTS glossary_term_relationships (
    id BIGSERIAL PRIMARY KEY,
    source_term_id VARCHAR(50) NOT NULL REFERENCES glossary_entries(term_id) ON DELETE CASCADE,
    related_term_id VARCHAR(50) NOT NULL REFERENCES glossary_entries(term_id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL, -- synonym, antonym, parent, child, related
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(source_term_id, related_term_id, relationship_type)
);

CREATE INDEX idx_glossary_relationships_source
    ON glossary_term_relationships(source_term_id);

-- =====================================================
-- 4. GLOSSARY_REVISIONS TABLE
-- =====================================================
-- Maintain complete history of all glossary changes

CREATE TABLE IF NOT EXISTS glossary_revisions (
    id BIGSERIAL PRIMARY KEY,
    term_id VARCHAR(50) NOT NULL,
    revision_number INTEGER NOT NULL,

    -- Changed Fields
    changed_fields JSONB,  -- {"term_english": {"old": "...", "new": "..."}...}
    change_description TEXT,
    change_reason VARCHAR(200),

    -- Who & When
    changed_by VARCHAR(100) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(term_id, revision_number)
);

CREATE INDEX idx_glossary_revisions_term
    ON glossary_revisions(term_id);

CREATE INDEX idx_glossary_revisions_date
    ON glossary_revisions(changed_at);

-- =====================================================
-- 5. GLOSSARY_USAGE_LOG TABLE
-- =====================================================
-- Track which terms are used in which UI components

CREATE TABLE IF NOT EXISTS glossary_usage_log (
    id BIGSERIAL PRIMARY KEY,
    term_id VARCHAR(50) NOT NULL REFERENCES glossary_entries(term_id) ON DELETE CASCADE,

    -- Usage Location
    file_path VARCHAR(500),             -- Next.js component file path
    component_name VARCHAR(255),        -- React component name
    component_type VARCHAR(50),         -- button, label, menu, error, tooltip, etc.

    -- Context
    page_route VARCHAR(255),            -- /assets, /backup, /travel, etc.
    language_used VARCHAR(20),          -- en, ta, ko

    -- Reference
    git_commit_hash VARCHAR(40),        -- Git commit where this usage was added
    version_deployed VARCHAR(20),       -- App version number

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,  -- When UI was verified to use this term

    UNIQUE(term_id, file_path, component_name, language_used)
);

CREATE INDEX idx_glossary_usage_component
    ON glossary_usage_log(component_name, component_type);

-- =====================================================
-- 6. SAMPLE DATA — ASSET MASTER TERMS
-- =====================================================

INSERT INTO glossary_entries (
    term_id, term_english, term_tamil, term_korean,
    module_category, subcategory, term_type,
    context_english, context_tamil, context_korean,
    standard_values, is_complete, has_standard_values
) VALUES
('1.1', 'Asset', 'சொத்து', '자산',
    'Core', 'Manufacturing', 'noun',
    'Physical equipment, machinery, tools tracked in the system',
    'தொழிற்சாலை மேனേஜ்மென்ட் சிஸ்டத்தில் ট্র্যাক் செய়া ভৌতিক সরঞ্জাম, যন্ত্রপাতি',
    '시스템에서 추적되는 물리적 장비, 기계, 도구',
    NULL, TRUE, FALSE),

('1.2', 'Asset Category', 'சொத்து வகை', '자산 분류',
    'Core', 'Manufacturing', 'noun',
    'Type classification for assets: Equipment, JIG, MOULD, Tools, Instruments',
    'சொத்துக்களுக்கான வகை வகைப்பாடு',
    '자산의 유형 분류: 장비, JIG, 금형, 도구, 계기',
    '{"Equipment", "JIG", "MOULD", "Tools", "Instruments"}', TRUE, TRUE),

('1.3', 'Asset Number', 'சொத்து எண்', '자산 번호',
    'Core', 'Manufacturing', 'noun',
    'Unique identifier assigned to each asset (e.g., AST-001)',
    'ஒவ்வொரு சொத்துக்கும் ஒதுக்கப்பட்ட தனித்துவமான அடையாளமாகக்கள்',
    '각 자산에 할당된 고유 식별자 (예: AST-001)',
    NULL, TRUE, FALSE),

('2.1.1', 'Create Asset', 'சொத்து உ்ஷ்டாக்கு', '자산 등록',
    'Asset', 'CRUD & Search', 'verb',
    'Add new asset to the system via form or import',
    'நতুন சொத்து ஊர்த्தা करणे वा एक्सेल् माध्यमे जोडे',
    '양식 또는 가져오기를 통해 시스템에 새 자산 추가',
    NULL, TRUE, FALSE),

('2.2.1', 'Category', 'வரைப', '분류',
    'Asset', 'Categories & Master Data', 'noun',
    'Asset type dropdown field on asset form',
    'சொத்து படிவத்தில் சொத்து வகை ட்ரপ్ડાউన్ಫields',
    '자산 양식의 자산 유형 드롭다운 필드',
    '{"Equipment", "JIG", "MOULD", "Tools", "Instruments"}', TRUE, TRUE),

('2.2.4', 'Status', 'നാ', '상태',
    'Core', 'Status & States', 'noun',
    'Operational status of asset: Active, Idle, Maintenance, Sold, Scrapped',
    'சொத்தின் செயல்பாட்டு நிலை: செயல்பாடு, செயலற்ற, பேறாமрिપ్్ు, விற்பனை, స్క్र్యాపుడ్',
    '자산의 운영 상태: 활성, 유휴, 보전 중, 판매됨, 폐기됨',
    '{"Active", "Idle", "Maintenance", "Sold", "Scrapped"}', TRUE, TRUE),

('3.1.1', 'Daily Reliability Score', 'దైนిక నమ్మకీయత చదరঙ్్చ', '일일 신뢰도',
    'Audit', 'Audit & Reliability', 'noun',
    'Daily assessment of system reliability (0-100%)',
    'सिस्टम विश्वसनीयता का दैनिक मूल्यांकन (0-100%)',
    '시스템 신뢰도의 일일 평가 (0-100%)',
    NULL, TRUE, FALSE),

('4.1.1', 'Travel Event', 'यात्रा कार्यक्रम', '여행 이벤트',
    'Travel', 'Travel Management', 'noun',
    'Business travel occurrence with dates, cost, and members',
    'തരംതിരിച്ച യാത്രാ സംഭവം തീയതികൾ, ചെലവ്, അംഗങ്ങൾ ഉൾപ്പെടെ',
    '날짜, 비용 및 참가자가 포함된 출장 발생',
    NULL, TRUE, FALSE),

('5.1.1', 'Backup Policy', 'बैकअप नीति', '백업 정책',
    'Backup', 'Backup & System', 'noun',
    'Schedule and retention configuration for automated backups',
    'ස්වයංක්रिয बैकअप के लिए शेडिউल और प्रतिधारण कॉन्फिगरेशन',
    '자동 백업을 위한 일정 및 보관 정책 구성',
    NULL, TRUE, FALSE);

-- =====================================================
-- 7. HELPER VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Get all incomplete glossary entries (missing translations)
CREATE OR REPLACE VIEW v_incomplete_glossary AS
SELECT
    term_id,
    term_english,
    CASE
        WHEN term_tamil IS NULL THEN 'Tamil'
        WHEN term_korean IS NULL THEN 'Korean'
        WHEN context_english IS NULL THEN 'English Context'
    END as missing_language,
    module_category,
    created_at
FROM glossary_entries
WHERE is_complete = FALSE
    AND status = 'active'
ORDER BY created_at DESC;

-- View: Get all terms by module with completion status
CREATE OR REPLACE VIEW v_glossary_by_module AS
SELECT
    module_category,
    subcategory,
    COUNT(*) as total_terms,
    SUM(CASE WHEN is_complete THEN 1 ELSE 0 END) as complete_terms,
    ROUND(100.0 * SUM(CASE WHEN is_complete THEN 1 ELSE 0 END) / COUNT(*), 1) as completion_percentage
FROM glossary_entries
WHERE status = 'active'
GROUP BY module_category, subcategory
ORDER BY module_category, completion_percentage DESC;

-- View: Get all glossary terms with their related terms
CREATE OR REPLACE VIEW v_glossary_with_relationships AS
SELECT
    g.term_id,
    g.term_english,
    g.term_tamil,
    g.term_korean,
    g.module_category,
    json_agg(
        json_build_object(
            'related_term_id', gr.related_term_id,
            'relationship_type', gr.relationship_type,
            'related_english', (SELECT term_english FROM glossary_entries WHERE term_id = gr.related_term_id)
        )
    ) as relationships
FROM glossary_entries g
LEFT JOIN glossary_term_relationships gr ON g.term_id = gr.source_term_id
WHERE g.status = 'active'
GROUP BY g.term_id, g.term_english, g.term_tamil, g.term_korean, g.module_category
ORDER BY g.module_category, g.term_english;

-- =====================================================
-- 8. STORED PROCEDURES FOR COMMON OPERATIONS
-- =====================================================

-- Procedure: Search glossary across all languages
CREATE OR REPLACE FUNCTION search_glossary(search_term VARCHAR)
RETURNS TABLE(
    term_id VARCHAR,
    term_english VARCHAR,
    term_tamil VARCHAR,
    term_korean VARCHAR,
    module_category VARCHAR,
    match_type VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.term_id,
        g.term_english,
        g.term_tamil,
        g.term_korean,
        g.module_category,
        CASE
            WHEN LOWER(g.term_english) LIKE LOWER('%' || search_term || '%') THEN 'English'
            WHEN LOWER(g.context_english) LIKE LOWER('%' || search_term || '%') THEN 'English Context'
            ELSE 'Other'
        END as match_type
    FROM glossary_entries g
    WHERE g.status = 'active'
        AND (LOWER(g.term_english) LIKE LOWER('%' || search_term || '%')
            OR LOWER(g.context_english) LIKE LOWER('%' || search_term || '%'))
    ORDER BY g.module_category, g.term_english;
END;
$$ LANGUAGE plpgsql;

-- Procedure: Get glossary term with all related information
CREATE OR REPLACE FUNCTION get_glossary_term(p_term_id VARCHAR)
RETURNS TABLE(
    term_id VARCHAR,
    term_english VARCHAR,
    term_tamil VARCHAR,
    term_korean VARCHAR,
    context_english TEXT,
    context_tamil TEXT,
    context_korean TEXT,
    module_category VARCHAR,
    standard_values TEXT[],
    related_terms JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH related AS (
        SELECT
            source_term_id,
            json_agg(
                json_build_object(
                    'term_id', related_term_id,
                    'relationship', relationship_type,
                    'term_english', (SELECT term_english FROM glossary_entries WHERE term_id = gtr.related_term_id)
                )
            ) as related_json
        FROM glossary_term_relationships gtr
        WHERE source_term_id = p_term_id
        GROUP BY source_term_id
    )
    SELECT
        g.term_id,
        g.term_english,
        g.term_tamil,
        g.term_korean,
        g.context_english,
        g.context_tamil,
        g.context_korean,
        g.module_category,
        g.standard_values,
        COALESCE(r.related_json, '[]'::jsonb) as related_terms
    FROM glossary_entries g
    LEFT JOIN related r ON g.term_id = r.source_term_id
    WHERE g.term_id = p_term_id;
END;
$$ LANGUAGE plpgsql;

-- Procedure: Add new glossary entry with full audit
CREATE OR REPLACE FUNCTION add_glossary_entry(
    p_term_id VARCHAR,
    p_term_english VARCHAR,
    p_term_tamil VARCHAR,
    p_term_korean VARCHAR,
    p_module_category VARCHAR,
    p_context_english TEXT,
    p_context_tamil TEXT,
    p_context_korean TEXT,
    p_created_by VARCHAR
)
RETURNS TABLE(
    success BOOLEAN,
    term_id VARCHAR,
    message VARCHAR
) AS $$
DECLARE
    v_term_id VARCHAR;
BEGIN
    -- Check if term_id already exists
    IF EXISTS (SELECT 1 FROM glossary_entries WHERE term_id = p_term_id) THEN
        RETURN QUERY SELECT FALSE, p_term_id, 'Term ID already exists'::VARCHAR;
        RETURN;
    END IF;

    -- Insert new entry
    INSERT INTO glossary_entries (
        term_id, term_english, term_tamil, term_korean,
        module_category, context_english, context_tamil, context_korean,
        created_by, is_complete
    ) VALUES (
        p_term_id, p_term_english, p_term_tamil, p_term_korean,
        p_module_category, p_context_english, p_context_tamil, p_context_korean,
        p_created_by,
        CASE WHEN p_term_tamil IS NOT NULL AND p_term_korean IS NOT NULL THEN TRUE ELSE FALSE END
    );

    RETURN QUERY SELECT TRUE, p_term_id, 'Entry created successfully'::VARCHAR;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. RLS POLICIES (Row Level Security) — OPTIONAL
-- =====================================================
-- Uncomment if using Supabase Auth

-- ALTER TABLE glossary_entries ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY glossary_view_all ON glossary_entries FOR SELECT
--     USING (status = 'active');
--
-- CREATE POLICY glossary_edit_translator ON glossary_entries FOR UPDATE
--     USING (auth.role() = 'translator' OR auth.role() = 'admin');

-- =====================================================
-- 10. MIGRATION NOTES
-- =====================================================
--
-- Migration Path (if updating from v1.0):
-- 1. Export existing glossary_v1.0 data
-- 2. Map old terms to new term_id format (1.1, 1.2, 2.1.1, etc.)
-- 3. Run INSERT statements to populate glossary_entries
-- 4. Verify completeness using v_glossary_by_module view
-- 5. Add relationships using glossary_term_relationships table
-- 6. Log all changes in glossary_revisions table
-- 7. Test search functionality with search_glossary() function
-- 8. Publish to production after validation
--

-- =====================================================
-- EXECUTION GUIDE FOR SUPABASE
-- =====================================================
--
-- 1. Connect to Supabase PostgreSQL console
-- 2. Run entire script (Ctrl+Enter or Submit)
-- 3. Verify tables exist: SELECT * FROM information_schema.tables WHERE table_schema = 'public'
-- 4. Insert sample data (section 6)
-- 5. Test views: SELECT * FROM v_glossary_by_module
-- 6. Test functions: SELECT * FROM search_glossary('Asset')
--

COMMIT;
