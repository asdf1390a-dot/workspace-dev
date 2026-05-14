# Rolling Window Chart Implementation

## Overview

Your monthly PowerPoint/Excel graphs now support a **rolling window** that automatically shifts data references each month. When a new month is added, the previous oldest month is automatically dropped from chart data ranges.

## Architecture

### Files Added
- `lib/reports/rolling-window-charts.js` — Rolling window calculation and chart XML updates
- `lib/reports/template-manager.js` — April baseline template management and workflow

### Files Modified
- `lib/reports/excel-processor.js` — Integrated rolling window chart updates
- `lib/reports/ppt-processor.js` — Integrated rolling window chart updates
- `pages/api/reports/quality/generate.js` — Added `rolling_window_size` parameter

## How It Works

### 1. Data Structure
April 2026 Template (월지표 sheet):
- Column U = January
- Column V = February
- Column W = March
- Column X = April
- ... Column AF = December

Each month's data occupies exactly one column.

### 2. Rolling Window Calculation
For a **3-month rolling window** (default):

| Month | Chart Shows | Columns |
|-------|-------------|---------|
| April (당월) | Jan-Feb-Mar | U, V, W |
| May | Feb-Mar-Apr | V, W, X |
| June | Mar-Apr-May | W, X, Y |
| July | Apr-May-Jun | X, Y, Z |

When you call the API, it:
1. Calculates which columns are in the rolling window
2. Finds all chart data ranges that reference the old window
3. Updates references to point to the new window
4. Preserves all formatting and styles

### 3. API Usage

```javascript
// POST /api/reports/quality/generate
// multipart/form-data

{
  target_month: "2026-05-01",           // YYYY-MM-01 format
  prev_excel: <File>,                  // April completed Excel
  prev_ppt: <File>,                    // April completed PPT
  data_excel: <File>,                  // May raw data from Korea Report
  rolling_window_size: "3"             // optional, default 3
}

// Response
{
  id: "uuid",
  target_month: "2026-05-01",
  excel: { url, filename, path },
  ppt: { url, filename, path }
}
```

### 4. Chart Types Supported

Charts are automatically updated in:
- ✅ **Excel charts** (embedded in sheets)
  - BarChart (막대그래프)
  - LineChart (꺾은선그래프)
  - AreaChart (영역형)
  - All chart types using data references
  
- ✅ **PowerPoint charts** (embedded in presentations)
  - Both linked (Excel data source) and embedded charts

## Monthly Workflow

### First Month (April - Already Done)
April 2026 is the baseline template containing Jan-Mar complete data + April starting point.

### Monthly Generation (May Onward)

```
Step 1: Prepare Inputs
├─ prev_excel: 2026-04월_경영실적.xlsx (April completed)
├─ prev_ppt: 2026-04월_품질현황.pptx (April completed)
└─ data_excel: 5월_raw_data.xlsx (May Korea Report)

Step 2: Process (Automatic)
├─ Excel:
│  ├─ Copy April template
│  ├─ Update May column (X) with Korea Report data
│  ├─ Keep Jan-Apr historical data intact
│  └─ Update chart rolling window: Feb-Apr → Apr-May
│
└─ PowerPoint:
   ├─ Copy April PPT
   ├─ Replace text: "4월" → "5월"
   └─ Update chart data ranges: Feb-Apr → Mar-May

Step 3: Output
├─ 2026-05월_경영실적.xlsx (May completed)
├─ 2026-05월_품질현황.pptx (May completed)
└─ Store in Supabase (quality-reports bucket)

Step 4: Next Month
├─ Use May completed Excel as "prev_excel"
├─ Use May completed PPT as "prev_ppt"
└─ Add June Korea Report as "data_excel"
```

## Data Integrity

### What Gets Updated Each Month
- ✅ New month's data column (Month N)
- ✅ Month labels in text ("4월" → "5월")
- ✅ Chart rolling window ranges
- ✅ Summary calculations in formulas

### What Never Changes
- ❌ Historical data (Jan-Mar in April; Jan-Apr in May, etc.)
- ❌ Cell formatting, colors, borders
- ❌ Formula structure
- ❌ Sheet names, tabs, navigation

### Data Chain
```
Apr Template (Jan-Mar locked + Apr data)
    ↓ (May raw data)
→ May Report (Jan-Apr locked + May data)
    ↓ (June raw data)
→ June Report (Jan-May locked + June data)
    ↓ continues...
```

## Configuration

### Rolling Window Size
Default: **3 months** (most recent 3 months always visible in charts)

To customize:
```javascript
// Override when calling API
POST /api/reports/quality/generate
body: { rolling_window_size: 6 }  // Show last 6 months instead
```

Valid range: 1-12 months

### Template Location
- Local: `/public/templates/경영실적_4월_기본템플릿.xlsx`
- Backup: Supabase `templates` bucket
- System auto-uses local if available, falls back to Supabase

## Troubleshooting

### Charts Not Updating
1. Verify chart data range format: `$월지표.$U$26:$W$40`
2. Check that range references exist in the Excel file
3. Ensure column letters are correct (A-Z, AA-AF)

### Historical Data Changed
1. Do NOT reuse old completed files as "prev_excel"
2. Always use the most recent month's completed file
3. Each month builds on the previous month, not from template

### Rolling Window Wrong
1. Verify `rollingWindowSize` parameter in API call
2. Check month calculation (ensure `prevMonth` and `curMonth` are 1-12)
3. Confirm columns in 월지표 sheet are as expected

## Examples

### April to May Transition
```javascript
// Generate May report
const formData = new FormData();
formData.append('target_month', '2026-05-01');
formData.append('prev_excel', april_file);  // April 2026 completed
formData.append('prev_ppt', april_ppt_file);
formData.append('data_excel', may_raw_data);
formData.append('rolling_window_size', '3');

const response = await fetch('/api/reports/quality/generate', {
  method: 'POST',
  body: formData,
  headers: { 'Authorization': `Bearer ${token}` }
});

const { excel, ppt } = await response.json();
// excel.url → Download May completed Excel
// ppt.url → Download May completed PowerPoint
```

### Verifying Rolling Window
```javascript
import { getRollingWindowInfo } from '@/lib/reports/rolling-window-charts';

// What columns are in the chart for May?
const info = getRollingWindowInfo(5, 3, '월지표');
console.log(info);
// {
//   windowSize: 3,
//   currentMonth: 5,
//   months: [3, 4, 5],
//   columns: ['W', 'X', 'Y'],
//   range: 'W:Y'
// }
```

## Next Steps

1. ✅ Rolling window calculation engine ready
2. ✅ Excel chart update logic integrated
3. ✅ PowerPoint chart update logic integrated
4. ⏳ Test with actual April template + May raw data
5. ⏳ Verify chart data ranges update correctly
6. ⏳ Set up automated monthly generation workflow

To test now:
1. Upload April completed Excel + PPT + May raw data to `/api/reports/quality/generate`
2. Download outputs and verify:
   - May data appears in correct column
   - Chart rolling window shows Feb-Apr
   - Formatting is preserved
