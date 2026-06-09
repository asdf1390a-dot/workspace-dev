#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class EvaluatorAutoRemediation {
  constructor() {
    this.logFile = path.join(__dirname, '../memory/logs/evaluator-remediation.log');
    this.errorLogFile = path.join(__dirname, '../memory-automation/evaluator-error-log.jsonl');
    this.rulesDir = path.join(__dirname, '../memory');
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}`;
    console.log(logLine);
    fs.appendFileSync(this.logFile, logLine + '\n');
  }

  recordError(errorData) {
    fs.appendFileSync(this.errorLogFile, JSON.stringify(errorData) + '\n');
  }

  async detectKoreanCommitViolations() {
    try {
      this.log('INFO', '한글 커밋 규칙 위반 검사 중...');

      const { stdout } = await execAsync('git log --oneline -20', { cwd: path.join(__dirname, '..') });
      const commits = stdout.trim().split('\n').filter(line => line.includes('chore(ctb):'));

      let violations = 0;
      for (const commit of commits) {
        const match = commit.match(/^([a-f0-9]+)\s+(.*)/);
        if (!match) continue;

        const [, hash, message] = match;
        const hasEnglish = /[A-Z]{2,}|PERFECT|STABILITY|CONTINUES|Polling Cycle|SYSTEMS|OK|projects|stable/g.test(message);

        if (hasEnglish && !message.includes('폴링 사이클')) {
          this.log('WARN', `한글 규칙 위반 감지: ${hash} — ${message.substring(0, 80)}`);

          this.recordError({
            timestamp: new Date().toISOString(),
            error_id: `E-AUTO-${Date.now()}`,
            severity: 'P0',
            category: 'korean_rule_violation',
            rule: 'feedback_korean_only_reporting.md',
            commit: hash,
            message: `자동 감지: 영어 문자열 포함 (${message.substring(0, 60)})`,
            status: 'detected',
            action: 'require_regeneration'
          });

          violations++;
        }
      }

      return violations;
    } catch (error) {
      this.log('ERROR', `한글 검사 실패: ${error.message}`);
      return -1;
    }
  }

  async detectMemoryVerificationFailures() {
    try {
      this.log('INFO', '메모리 검증 규칙 위반 검사 중...');

      const memoryRules = [
        'feedback_core_autonomous_operation.md',
        'feedback_evaluator_memory_verification.md',
        'feedback_korean_only_reporting.md',
        'evaluator_responsibilities_and_rules.md'
      ];

      let missingRules = [];
      for (const rule of memoryRules) {
        if (!fs.existsSync(path.join(this.rulesDir, rule))) {
          missingRules.push(rule);
          this.log('WARN', `규칙 파일 누락: ${rule}`);
        }
      }

      if (missingRules.length > 0) {
        this.recordError({
          timestamp: new Date().toISOString(),
          error_id: `E-MEMORY-${Date.now()}`,
          severity: 'P1',
          category: 'missing_rule_files',
          message: `필수 규칙 파일 ${missingRules.length}개 누락`,
          missing_files: missingRules,
          status: 'critical'
        });
      }

      return missingRules.length;
    } catch (error) {
      this.log('ERROR', `메모리 검증 실패: ${error.message}`);
      return -1;
    }
  }

  async triggerAutoRemediation() {
    try {
      this.log('INFO', '자동 재생성 프로세스 시작...');

      const scriptPath = path.join(__dirname, 'ctb-polling-commit.sh');
      if (fs.existsSync(scriptPath)) {
        const { stdout, stderr } = await execAsync(`bash ${scriptPath}`, {
          cwd: path.join(__dirname, '..')
        });

        if (stderr && !stderr.includes('found no changes')) {
          this.log('WARN', `재생성 경고: ${stderr}`);
          return false;
        }

        this.log('INFO', '자동 재생성 성공: ctb-polling-commit.sh 실행 완료');
        return true;
      } else {
        this.log('ERROR', 'ctb-polling-commit.sh 파일 없음');
        return false;
      }
    } catch (error) {
      this.log('ERROR', `자동 재생성 실패: ${error.message}`);
      return false;
    }
  }

  async run() {
    this.log('INFO', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.log('INFO', '평가자 자동 개입 & 재생성 시스템 시작');
    this.log('INFO', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const koreanViolations = await this.detectKoreanCommitViolations();
    const memoryViolations = await this.detectMemoryVerificationFailures();

    const totalViolations = koreanViolations + memoryViolations;

    if (totalViolations > 0) {
      this.log('WARN', `총 ${totalViolations}개 규칙 위반 감지됨`);

      const remediated = await this.triggerAutoRemediation();
      if (remediated) {
        this.log('INFO', '✅ 자동 개입 성공 — 위반 제거 완료');
      } else {
        this.log('ERROR', '❌ 자동 개입 실패 — 수동 개입 필요');
      }
    } else {
      this.log('INFO', '✅ 규칙 위반 0개 — 시스템 정상');
    }

    this.log('INFO', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

if (require.main === module) {
  const remediation = new EvaluatorAutoRemediation();
  remediation.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = EvaluatorAutoRemediation;
