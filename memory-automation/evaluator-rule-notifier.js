#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class EvaluatorRuleNotifier {
  constructor() {
    this.logFile = path.join(__dirname, '../memory/logs/evaluator-rule-notifier.log');
    this.memoryFile = path.join(__dirname, '../memory/MEMORY.md');
    this.notificationLogFile = path.join(__dirname, '../memory-automation/evaluator-notifications.jsonl');
    this.lastCheckFile = path.join(__dirname, '../memory-automation/last-rule-check.json');
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}`;
    console.log(logLine);
    fs.appendFileSync(this.logFile, logLine + '\n');
  }

  recordNotification(notification) {
    const entry = {
      timestamp: new Date().toISOString(),
      ...notification
    };
    fs.appendFileSync(this.notificationLogFile, JSON.stringify(entry) + '\n');
  }

  getLastCheckState() {
    try {
      if (fs.existsSync(this.lastCheckFile)) {
        const content = fs.readFileSync(this.lastCheckFile, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      this.log('WARN', `마지막 체크 상태 로드 실패: ${error.message}`);
    }

    return {
      lastCheck: new Date(0).toISOString(),
      knownRules: [],
      notifiedRules: []
    };
  }

  saveCheckState(state) {
    try {
      fs.writeFileSync(this.lastCheckFile, JSON.stringify(state, null, 2));
    } catch (error) {
      this.log('ERROR', `체크 상태 저장 실패: ${error.message}`);
    }
  }

  extractRulesFromMemory() {
    try {
      const content = fs.readFileSync(this.memoryFile, 'utf8');
      const lines = content.split('\n');

      const rules = [];
      const rulePattern = /^- \[(.+?)\]\((.+?\.md)\)/;

      for (const line of lines) {
        const match = line.match(rulePattern);
        if (match) {
          const [, title, filename] = match;
          rules.push({
            title: title.trim(),
            filename: filename.trim(),
            url: filename.trim()
          });
        }
      }

      return rules;
    } catch (error) {
      this.log('ERROR', `MEMORY.md 파싱 실패: ${error.message}`);
      return [];
    }
  }

  checkForNewRules() {
    this.log('INFO', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.log('INFO', '평가자 규칙 알림 시스템 시작');
    this.log('INFO', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const lastState = this.getLastCheckState();
    const currentRules = this.extractRulesFromMemory();

    this.log('INFO', `이전 검사: ${new Date(lastState.lastCheck).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
    this.log('INFO', `현재 규칙: ${currentRules.length}개`);
    this.log('INFO', `이전 규칙: ${lastState.knownRules.length}개`);

    const newRules = currentRules.filter(rule => !lastState.knownRules.some(kr => kr.filename === rule.filename));
    const removedRules = lastState.knownRules.filter(rule => !currentRules.some(cr => cr.filename === rule.filename));

    if (newRules.length > 0) {
      this.log('WARN', `🚨 새로운 규칙 ${newRules.length}개 감지됨:`);
      newRules.forEach((rule, i) => {
        this.log('WARN', `  [${i + 1}] ${rule.title} — ${rule.filename}`);

        this.recordNotification({
          type: 'new_rule_detected',
          severity: 'P0',
          rule: rule,
          message: `새로운 규칙 추가됨: ${rule.title}`,
          action_required: '분석 전 반드시 읽으세요',
          path: rule.filename
        });
      });

      this.log('WARN', `❌ ACTION: 평가자는 분석 전 반드시 새로운 규칙을 읽어야 합니다!`);
    } else {
      this.log('INFO', '✅ 새로운 규칙 없음');
    }

    if (removedRules.length > 0) {
      this.log('INFO', `규칙 ${removedRules.length}개 제거됨:`);
      removedRules.forEach((rule, i) => {
        this.log('INFO', `  [${i + 1}] ${rule.title}`);
      });
    }

    const updatedState = {
      lastCheck: new Date().toISOString(),
      knownRules: currentRules,
      notifiedRules: [
        ...lastState.notifiedRules,
        ...newRules.map(r => r.filename)
      ].slice(-100)
    };

    this.saveCheckState(updatedState);

    if (newRules.length > 0) {
      this.generateEvaluatorAlert(newRules);
    }

    this.log('INFO', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      newRules: newRules,
      removedRules: removedRules,
      totalRules: currentRules.length
    };
  }

  generateEvaluatorAlert(newRules) {
    const alertPath = path.join(__dirname, '../memory/alerts/evaluator-alert-new-rules.md');
    const alertDir = path.dirname(alertPath);

    if (!fs.existsSync(alertDir)) {
      fs.mkdirSync(alertDir, { recursive: true });
    }

    const alertContent = `---
generated: ${new Date().toISOString()}
type: evaluator_alert
severity: P0
---

# 🚨 평가자 알림: 새로운 규칙 추가됨

**생성 시간:** ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}

## 📋 새로운 규칙 목록

${newRules.map((rule, i) => `${i + 1}. **${rule.title}**
   - 파일: \`${rule.filename}\`
   - 필수 읽기: 분석 제출 전 반드시 확인`).join('\n\n')}

## ⚠️ 필수 조치

${newRules.map(rule => `- [ ] \`${rule.filename}\` 읽음`).join('\n')}
- [ ] 현재 작업에 해당 규칙이 적용되는지 확인
- [ ] 규칙 위반 사항 검사 완료
- [ ] 모든 체크박스 완료 후 분석 제출

## 📌 평가자 책임

새 규칙이 추가되면:
1. **반드시 읽어야 함** — 분석 전 필수
2. **적용 여부 판단** — 현재 작업과 연관성 확인
3. **위반 검사** — 설정된 모든 규칙이 지켜지고 있는지 확인
4. **자동 개입** — 위반 발견 시 즉시 보고 및 수정 지시

---

**다음 보고:** 분석 제출 시 이 알림 확인 완료 명시
`;

    fs.writeFileSync(alertPath, alertContent);
    this.log('INFO', `평가자 알림 문서 생성: ${alertPath}`);
  }
}

if (require.main === module) {
  const notifier = new EvaluatorRuleNotifier();
  const result = notifier.checkForNewRules();

  process.exit(result.newRules.length > 0 ? 1 : 0);
}

module.exports = EvaluatorRuleNotifier;
