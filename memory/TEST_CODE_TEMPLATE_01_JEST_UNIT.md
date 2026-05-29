# Jest Unit Test Template — DSC FMS Portal Projects

**Document**: TEST_CODE_TEMPLATE_01_JEST_UNIT.md  
**Version**: 1.0 (2026-06-02)  
**Purpose**: Reference implementation for Jest unit tests across all 7 DSC FMS projects  
**Target Projects**: Discord-P1, Travel-P2, Asset-P2, Backup-P2, Team-Dashboard-P2B, Harness-ENG-P2, BM-P1  
**Coverage Target**: ≥80% (branches, statements, functions)  

---

## Part 1: Jest Configuration (jest.config.js)

```javascript
module.exports = {
  displayName: 'dsc-fms-unit-tests',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    'pages/**/*.js',
    '!src/**/*.d.ts',
    '!pages/api/**/*.js', // API routes tested separately
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 10000,
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
```

---

## Part 2: Jest Setup (jest.setup.js)

```javascript
// Global test utilities and fixtures
global.testFixtures = {
  // Asset-P2: Mock asset data with QR codes
  assetData: {
    asset_id: 'AST-001-QR-2026',
    qr_code: 'https://qr.dsc.in/AST-001',
    name: 'Industrial Pump - Make A',
    category: 'Machinery',
    location: 'Building-B-Floor-2',
    created_at: '2026-01-15T10:30:00Z',
    created_by: 'tech_lead_1',
  },

  // Travel-P2: Mock travel request with voucher metadata
  travelData: {
    travel_id: 'TRV-2026-0452',
    status: 'draft',
    purpose: 'Client meeting - Chennai visit',
    start_date: '2026-06-05',
    end_date: '2026-06-07',
    budget: 50000,
    currency: 'INR',
    vouchers: [
      {
        id: 'VCH-001',
        type: 'flight',
        amount: 25000,
        pdf_url: 'https://storage.dsc.in/vchs/flight-2026-0452.pdf',
      },
    ],
  },

  // Backup-P2: Mock backup metadata
  backupData: {
    backup_id: 'BKP-2026-05-29-001',
    status: 'completed',
    created_at: '2026-05-29T00:00:00Z',
    files_count: 1542,
    size_bytes: 104857600, // 100MB
    checksum: 'sha256:abc123def456...',
    compressed: true,
  },

  // Team-Dashboard-P2B: Mock organization structure
  orgData: {
    team_id: 'TM-PROD-2026',
    name: 'Production Team',
    parent_team_id: null,
    members: [
      { member_id: 'M-001', name: 'Kyeongtae Na', role: 'lead', created_at: '2026-01-01' },
      { member_id: 'M-002', name: 'Tech Lead', role: 'manager', created_at: '2026-02-01' },
    ],
  },

  // Harness-ENG-P2: Mock sensor telemetry
  sensorData: {
    sensor_id: 'SEN-VIBRATION-01',
    timestamp: '2026-05-29T14:30:45Z',
    value: 1.5,
    unit: 'g',
    status: 'normal',
    threshold_warning: 2.0,
    threshold_critical: 3.5,
  },
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key-xyz';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';
```

---

## Part 3: Unit Test Examples by Project Type

### 3.1 Asset Master Phase 2 — QR Code Search Logic

**File**: `src/utils/__tests__/asset-search.test.js`

```javascript
import { searchAssetByQR, filterAssetsByCategory, calculatePermissions } from '../asset-search';

describe('Asset Search Utilities', () => {
  let mockSupabase;

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: global.testFixtures.assetData,
              error: null,
            }),
          }),
        }),
      }),
    };
  });

  describe('searchAssetByQR', () => {
    it('should find asset by valid QR code', async () => {
      const result = await searchAssetByQR('AST-001-QR-2026', mockSupabase);
      expect(result).toEqual(global.testFixtures.assetData);
      expect(result.qr_code).toBe('https://qr.dsc.in/AST-001');
    });

    it('should return null for non-existent QR code', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'No rows found' },
      });

      const result = await searchAssetByQR('INVALID-QR', mockSupabase);
      expect(result).toBeNull();
    });

    it('should handle malformed QR input', () => {
      expect(() => searchAssetByQR('', mockSupabase)).toThrow('QR code cannot be empty');
      expect(() => searchAssetByQR(null, mockSupabase)).toThrow('QR code must be a string');
    });
  });

  describe('filterAssetsByCategory', () => {
    it('should filter assets by category', () => {
      const assets = [
        { ...global.testFixtures.assetData, category: 'Machinery' },
        { ...global.testFixtures.assetData, asset_id: 'AST-002', category: 'Tools' },
      ];
      
      const filtered = filterAssetsByCategory(assets, 'Machinery');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].category).toBe('Machinery');
    });

    it('should return empty array for no matches', () => {
      const assets = [global.testFixtures.assetData];
      const filtered = filterAssetsByCategory(assets, 'NonExistent');
      expect(filtered).toHaveLength(0);
    });
  });

  describe('calculatePermissions', () => {
    it('should grant full permissions to creator', () => {
      const asset = global.testFixtures.assetData;
      const userId = 'tech_lead_1';
      
      const perms = calculatePermissions(asset, userId);
      expect(perms).toEqual({
        read: true,
        update: true,
        delete: true,
        share: true,
      });
    });

    it('should grant read-only to non-creator', () => {
      const asset = global.testFixtures.assetData;
      const userId = 'other_user';
      
      const perms = calculatePermissions(asset, userId);
      expect(perms.read).toBe(true);
      expect(perms.update).toBe(false);
      expect(perms.delete).toBe(false);
    });
  });
});
```

---

### 3.2 Travel Management Phase 2 — PDF Parsing & Validation

**File**: `src/utils/__tests__/travel-voucher-parser.test.js`

```javascript
import { parsePDFVoucher, extractCurrency, validateDateRange } from '../travel-voucher-parser';

describe('Travel Voucher Parser', () => {
  describe('parsePDFVoucher', () => {
    it('should extract amount and date from PDF metadata', async () => {
      const mockPDF = {
        getText: jest.fn().mockReturnValue(
          'Invoice Date: 2026-05-20\nTotal Amount: INR 25,000'
        ),
      };

      const result = await parsePDFVoucher(mockPDF);
      expect(result.amount).toBe(25000);
      expect(result.date).toBe('2026-05-20');
      expect(result.currency).toBe('INR');
    });

    it('should handle USD currency parsing', async () => {
      const mockPDF = {
        getText: jest.fn().mockReturnValue(
          'Invoice Date: 2026-05-20\nTotal Amount: USD 1,500'
        ),
      };

      const result = await parsePDFVoucher(mockPDF);
      expect(result.currency).toBe('USD');
      expect(result.amount).toBe(1500);
    });

    it('should throw error for corrupted PDF', async () => {
      const mockPDF = {
        getText: jest.fn().mockRejectedValue(new Error('PDF parse error')),
      };

      await expect(parsePDFVoucher(mockPDF)).rejects.toThrow('PDF parse error');
    });
  });

  describe('extractCurrency', () => {
    it('should extract INR from text', () => {
      const text = 'Amount: INR 50,000';
      expect(extractCurrency(text)).toBe('INR');
    });

    it('should extract USD from text', () => {
      const text = 'Total: USD 2,500.50';
      expect(extractCurrency(text)).toBe('USD');
    });

    it('should return INR as default', () => {
      expect(extractCurrency('No currency specified')).toBe('INR');
    });
  });

  describe('validateDateRange', () => {
    it('should validate correct travel dates', () => {
      const startDate = '2026-06-05';
      const endDate = '2026-06-07';
      expect(validateDateRange(startDate, endDate)).toBe(true);
    });

    it('should reject invalid date order', () => {
      const startDate = '2026-06-10';
      const endDate = '2026-06-05';
      expect(validateDateRange(startDate, endDate)).toBe(false);
    });

    it('should reject dates in the past', () => {
      const startDate = '2025-06-05';
      const endDate = '2025-06-07';
      expect(validateDateRange(startDate, endDate)).toBe(false);
    });
  });
});
```

---

### 3.3 Backup App Phase 2 — Checksum & Integrity

**File**: `src/utils/__tests__/backup-integrity.test.js`

```javascript
import { calculateChecksum, verifyIntegrity, scheduleBackupJob } from '../backup-integrity';
import crypto from 'crypto';

describe('Backup Integrity', () => {
  describe('calculateChecksum', () => {
    it('should calculate SHA-256 checksum', () => {
      const fileContent = 'test backup data';
      const checksum = calculateChecksum(fileContent);
      
      const expected = crypto.createHash('sha256').update(fileContent).digest('hex');
      expect(checksum).toBe(expected);
    });

    it('should return consistent checksums', () => {
      const fileContent = global.testFixtures.backupData;
      const checksum1 = calculateChecksum(fileContent);
      const checksum2 = calculateChecksum(fileContent);
      
      expect(checksum1).toBe(checksum2);
    });
  });

  describe('verifyIntegrity', () => {
    it('should verify matching checksums', () => {
      const fileContent = 'backup content';
      const checksum = calculateChecksum(fileContent);
      
      const isValid = verifyIntegrity(fileContent, checksum);
      expect(isValid).toBe(true);
    });

    it('should detect corrupted backup', () => {
      const originalChecksum = 'abc123def456xyz';
      const corruptedChecksum = 'different_checksum';
      
      const isValid = verifyIntegrity('any content', corruptedChecksum);
      expect(isValid).toBe(false);
    });
  });

  describe('scheduleBackupJob', () => {
    it('should parse valid cron expression', () => {
      const result = scheduleBackupJob('0 0 * * *'); // Daily at midnight
      expect(result.valid).toBe(true);
      expect(result.nextRun).toBeDefined();
    });

    it('should reject invalid cron expression', () => {
      const result = scheduleBackupJob('invalid cron');
      expect(result.valid).toBe(false);
    });

    it('should prevent duplicate backup scheduling', () => {
      const job1 = scheduleBackupJob('0 0 * * *');
      const job2 = scheduleBackupJob('0 0 * * *');
      
      expect(job2.error).toContain('duplicate');
    });
  });
});
```

---

### 3.4 Team Dashboard Phase 2B — Org Tree & Permissions

**File**: `src/utils/__tests__/org-hierarchy.test.js`

```javascript
import { buildOrgTree, calculatePermissionInheritance, detectCircularReference } from '../org-hierarchy';

describe('Organization Hierarchy', () => {
  let orgData;

  beforeEach(() => {
    orgData = {
      teams: [
        { team_id: 'TM-001', name: 'Root Team', parent_team_id: null },
        { team_id: 'TM-002', name: 'Sub Team 1', parent_team_id: 'TM-001' },
        { team_id: 'TM-003', name: 'Sub Team 2', parent_team_id: 'TM-001' },
        { team_id: 'TM-004', name: 'Deep Sub', parent_team_id: 'TM-002' },
      ],
    };
  });

  describe('buildOrgTree', () => {
    it('should build correct hierarchy', () => {
      const tree = buildOrgTree(orgData.teams);
      
      expect(tree.team_id).toBe('TM-001');
      expect(tree.children).toHaveLength(2);
      expect(tree.children[0].children).toHaveLength(1); // TM-002 has TM-004
    });

    it('should handle empty team list', () => {
      const tree = buildOrgTree([]);
      expect(tree).toEqual({});
    });

    it('should handle orphaned teams gracefully', () => {
      const orphanedTeams = [
        { team_id: 'TM-999', name: 'Orphan', parent_team_id: 'TM-NONEXISTENT' },
      ];
      
      const tree = buildOrgTree(orphanedTeams);
      expect(tree.team_id).toBe('TM-999'); // Root position for orphan
    });
  });

  describe('calculatePermissionInheritance', () => {
    it('should inherit parent permissions to child', () => {
      const parentPerms = { read: true, update: true, delete: false };
      const childPerms = calculatePermissionInheritance('TM-002', parentPerms, orgData);
      
      expect(childPerms.read).toBe(true);
      expect(childPerms.update).toBe(true);
      expect(childPerms.delete).toBe(false);
    });

    it('should propagate to multiple levels', () => {
      const rootPerms = { read: true, update: true, delete: true };
      const deepPerms = calculatePermissionInheritance('TM-004', rootPerms, orgData);
      
      expect(deepPerms).toEqual(rootPerms);
    });
  });

  describe('detectCircularReference', () => {
    it('should detect A → B → A', () => {
      const circular = [
        { team_id: 'TM-A', parent_team_id: 'TM-B' },
        { team_id: 'TM-B', parent_team_id: 'TM-A' },
      ];
      
      expect(detectCircularReference(circular)).toEqual({
        found: true,
        cycle: ['TM-A', 'TM-B'],
      });
    });

    it('should allow valid hierarchy', () => {
      expect(detectCircularReference(orgData.teams)).toEqual({
        found: false,
      });
    });
  });
});
```

---

### 3.5 Harness Engineering Phase 2 — Sensor Data & Thresholds

**File**: `src/utils/__tests__/sensor-calculations.test.js`

```javascript
import { calculateAggregates, checkThresholds, formatSensorData } from '../sensor-calculations';

describe('Sensor Data Calculations', () => {
  const sensorReadings = [
    { value: 1.2, timestamp: '2026-05-29T14:00:00Z' },
    { value: 1.5, timestamp: '2026-05-29T14:05:00Z' },
    { value: 2.1, timestamp: '2026-05-29T14:10:00Z' },
    { value: 0.8, timestamp: '2026-05-29T14:15:00Z' },
  ];

  describe('calculateAggregates', () => {
    it('should calculate sum correctly', () => {
      const sum = calculateAggregates(sensorReadings, 'sum');
      expect(sum).toBe(5.6);
    });

    it('should calculate average correctly', () => {
      const avg = calculateAggregates(sensorReadings, 'average');
      expect(avg).toBeCloseTo(1.4, 1);
    });

    it('should find maximum value', () => {
      const max = calculateAggregates(sensorReadings, 'max');
      expect(max).toBe(2.1);
    });

    it('should find minimum value', () => {
      const min = calculateAggregates(sensorReadings, 'min');
      expect(min).toBe(0.8);
    });

    it('should calculate 95th percentile', () => {
      const p95 = calculateAggregates(sensorReadings, 'p95');
      expect(p95).toBeDefined();
      expect(p95).toBeGreaterThan(2.0);
    });
  });

  describe('checkThresholds', () => {
    const sensor = {
      sensor_id: 'SEN-VIBRATION-01',
      value: 2.5,
      unit: 'g',
      threshold_warning: 2.0,
      threshold_critical: 3.5,
    };

    it('should trigger warning for value between warning and critical', () => {
      const result = checkThresholds(sensor);
      expect(result.status).toBe('warning');
      expect(result.shouldAlert).toBe(true);
    });

    it('should trigger critical for value above critical threshold', () => {
      const criticalSensor = { ...sensor, value: 4.0 };
      const result = checkThresholds(criticalSensor);
      expect(result.status).toBe('critical');
      expect(result.severity).toBe('high');
    });

    it('should report normal for value below warning', () => {
      const normalSensor = { ...sensor, value: 1.5 };
      const result = checkThresholds(normalSensor);
      expect(result.status).toBe('normal');
      expect(result.shouldAlert).toBe(false);
    });
  });

  describe('formatSensorData', () => {
    it('should format with correct unit conversion', () => {
      const reading = { value: 1.5, unit: 'g', timestamp: '2026-05-29T14:30:45Z' };
      const formatted = formatSensorData(reading);
      
      expect(formatted.display_value).toBe('1.5 g');
      expect(formatted.timestamp_iso).toBe('2026-05-29T14:30:45Z');
    });

    it('should apply timezone conversion for IST', () => {
      const reading = { value: 2.0, unit: 'g', timestamp: '2026-05-29T14:30:45Z' };
      const formatted = formatSensorData(reading, 'IST');
      
      expect(formatted.timestamp_ist).toBeDefined();
    });
  });
});
```

---

## Part 4: Running Jest Tests

### Installation

```bash
npm install --save-dev jest @babel/preset-env babel-jest
```

### Commands

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run specific test file
npm test -- asset-search.test.js

# Run in watch mode (for development)
npm test -- --watch

# Run with verbose output
npm test -- --verbose

# Generate coverage badge
npm test -- --coverage --silent
```

### Expected Output (Example)

```
 PASS  src/utils/__tests__/asset-search.test.js
  Asset Search Utilities
    searchAssetByQR
      ✓ should find asset by valid QR code (12ms)
      ✓ should return null for non-existent QR code (8ms)
      ✓ should handle malformed QR input (5ms)
    filterAssetsByCategory
      ✓ should filter assets by category (6ms)
      ✓ should return empty array for no matches (4ms)
    calculatePermissions
      ✓ should grant full permissions to creator (7ms)
      ✓ should grant read-only to non-creator (5ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        2.341 s
Ran all test suites matching /asset-search.test.js/i with tests matching a pattern matching /.+/i.

Coverage Summary:
  Statements   : 85.2% (52/61)
  Branches     : 82.1% (32/39)
  Functions    : 88.3% (15/17)
  Lines        : 85.9% (49/57)
```

---

## Part 5: Coverage Targets by Project

| Project | Target Coverage | Focus Areas |
|---------|-----------------|------------|
| Discord-P1 | 80% | Message formatting, processor pipeline, error handling |
| Travel-P2 | 85% | PDF parsing, date validation, currency conversion, budget checks |
| Asset-P2 | 85% | QR search, category filtering, permission checks, audit logic |
| Backup-P2 | 80% | Checksum calculation, compression, schedule parsing, cleanup |
| Team-Dashboard-P2B | 85% | Org tree building, permission inheritance, circular detection |
| Harness-ENG-P2 | 80% | Sensor aggregates, threshold checking, data formatting |
| BM-P1 | 80% | Core utility functions, state transitions, metadata validation |

---

**Document Status**: ✅ Ready for commit (2026-06-02)  
**Next**: Integration test templates (Supertest) and E2E templates (Playwright)
