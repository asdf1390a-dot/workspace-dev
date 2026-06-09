#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class EvaluatorRuleChecker {
  constructor() {
    this.logFile = path.join(__dirname, '../memory/logs/evaluator-rule-check.log');
    this.memoryDir = path.join(__dirname, '../memory');
    this.rules = new Map();
    this.loadRules();
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}`;
    console.log(logLine);
    fs.appendFileSync(this.logFile, logLine + '\n');
  }

  loadRules() {
    const ruleFiles = [
      'feedback_core_autonomous_operation.md',
      'feedback_evaluator_memory_verification.md',
      'feedback_korean_only_reporting.md',
      'feedback_repetition_and_testing.md',
      'evaluator_responsibilities_and_rules.md'
    ];

    for (const ruleFile of ruleFiles) {
      const rulePath = path.join(this.memoryDir, ruleFile);
      try {
        if (fs.existsSync(rulePath)) {
          const content = fs.readFileSync(rulePath, 'utf8');
          this.rules.set(ruleFile, {
            path: rulePath,
            content: content,
            lines: content.split('\n').length,
            lastModified: fs.statSync(rulePath).mtime
          });
        }
      } catch (error) {
        this.log('WARN', `규칙 로드 실패: ${ruleFile} — ${error.message}`);
      }
    }

    this.log('INFO', `${this.rules.size}개 규칙 파일 로드됨`);
  }

  checkKoreanOnly(text, commitType = 'ctb_polling') {
    if (commitType === 'ctb_polling') {
      const englishPatterns = [
        /Polling Cycle/i,
        /PERFECT STABILITY/,
        /CONTINUES/,
        /ALL SYSTEMS/,
        /projects stable/i,
        /Uptime:/i
      ];

      const violations = [];
      for (const pattern of englishPatterns) {
        if (pattern.test(text)) {
          violations.push(pattern.source);
        }
      }

      if (violations.length > 0) {
        return {
          passed: false,
          rule: 'feedback_korean_only_reporting.md',
          violations: violations,
          severity: 'P0'
        };
      }
    }

    return { passed: true };
  }

  checkMemoryVerification(metadata = {}) {
    const requiredRules = [
      'feedback_core_autonomous_operation.md',
      'feedback_evaluator_memory_verification.md',
      'feedback_korean_only_reporting.md'
    ];

    const missingRules = requiredRules.filter(rule => !this.rules.has(rule));

    if (missingRules.length > 0) {
      return {
        passed: false,
        rule: 'evaluator_memory_verification',
        violations: missingRules,
        severity: 'P0',
        message: `필수 규칙 파일 ${missingRules.length}개 누락됨`
      };
    }

    const lastRuleModified = Math.max(...Array.from(this.rules.values()).map(r => r.lastModified.getTime()));
    const timeSinceRuleUpdate = Date.now() - lastRuleModified;

    if (timeSinceRuleUpdate < 3600000 && !metadata.rulesCheckedSince) {
      return {
        passed: false,
        rule: 'evaluator_responsibilities_and_rules.md',
        violations: ['새 규칙이 1시간 이내 추가됨 — 재검증 필요'],
        severity: 'P1',
        message: '분석 전 최신 규칙 확인 필수'
      };
    }

    return { passed: true };
  }

  checkCompleteness(analysisData = {}) {
    const requiredFields = [
      'rule_violations_checked',
      'auto_intervention_status',
      'error_tracking_updated',
      'final_approval'
    ];

    const missingFields = requiredFields.filter(field => !analysisData[field]);

    if (missingFields.length > 0) {
      return {
        passed: false,
        rule: 'evaluator_responsibilities_and_rules.md (Phase 3 checklist)',
        violations: missingFields,
        severity: 'P1',
        message: `분석 체크리스트 미완성 (${missingFields.length}개 항목)`
      };
    }

    return { passed: true };
  }

  validateAnalysis(commitMessage, metadata = {}) {
    this.log('INFO', `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    this.log('INFO', `분석 검증 시작 — 커밋: ${commitMessage.substring(0, 50)}...`);

    const checks = [
      this.checkMemoryVerification(metadata),
      this.checkKoreanOnly(commitMessage),
      this.checkCompleteness(metadata)
    ];

    const violations = checks.filter(c => !c.passed);

    if (violations.length > 0) {
      this.log('ERROR', `❌ 검증 실패: ${violations.length}개 규칙 위반`);
      violations.forEach((v, i) => {
        this.log('ERROR', `  [위반 ${i + 1}] ${v.rule}`);
        (v.violations || []).forEach(vio => {
          this.log('ERROR', `    - ${vio}`);
        });
      });
      this.log('INFO', `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      return { approved: false, violations: violations };
    } else {
      this.log('INFO', `✅ 검증 통과: 모든 규칙 준수`);
      this.log('INFO', `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      return { approved: true, violations: [] };
    }
  }

  printRuleStatus() {
    this.log('INFO', '┌─────────────────────────────────────────────┐');
    this.log('INFO', '│           로드된 규칙 파일 목록               │');
    this.log('INFO', '├─────────────────────────────────────────────┤');

    Array.from(this.rules.entries()).forEach(([name, data]) => {
      const modified = data.lastModified.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
      this.log('INFO', `│ ✅ ${name}`);
      this.log('INFO', `│    (${data.lines} lines, modified: ${modified})`);
    });

    this.log('INFO', '└─────────────────────────────────────────────┘');
  }
}

if (require.main === module) {
  const checker = new EvaluatorRuleChecker();
  checker.printRuleStatus();

  const testCommit = 'chore(ctb): 폴링 사이클 1017 @ 17:05 KST (6월 9일) — 완벽한 안정성 유지';
  const result = checker.validateAnalysis(testCommit);

  process.exit(result.approved ? 0 : 1);
}

module.exports = EvaluatorRuleChecker;
