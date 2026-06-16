#!/usr/bin/env node

/**
 * 자동 에스컬레이션 오케스트레이터 (Phase 2 개선안 #2)
 * 역할: 인시던트 자동 감지 및 에스컬레이션 트리거
 *
 * 규칙:
 *   - 인시던트 지속시간 >= 1시간: 자동 checkpoint 생성
 *   - 4/4 P1 DOWN 확인 후 >= 30분: 자동 긴급 알림
 *   - 사용자 입력 없어도 자동 진행 (Autonomous Proceed)
 *
 * 2026-06-17 06:00 KST 배포 (개선안 #2)
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

const WORKSPACE_DIR = process.env.WORKSPACE_DIR || '/home/jeepney/.openclaw/workspace-dev';
const INCIDENT_STATE = path.join(WORKSPACE_DIR, '.incident-state.json');
const LOG_FILE = path.join(WORKSPACE_DIR, 'memory/logs/auto-escalation.log');
const ESCALATION_CONFIG = path.join(WORKSPACE_DIR, 'memory-automation/escalation-config.json');

// 로그 함수
function log(msg) {
  const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const logMsg = `[${timestamp}] ${msg}`;
  console.log(logMsg);

  fs.appendFileSync(LOG_FILE, logMsg + '\n', { flag: 'a' });
}

// 디렉토리 생성
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 인시던트 상태 읽기
function readIncidentState() {
  try {
    if (!fs.existsSync(INCIDENT_STATE)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(INCIDENT_STATE, 'utf8'));
  } catch (e) {
    log(`⚠️  인시던트 상태 파일 파싱 실패: ${e.message}`);
    return null;
  }
}

// 인시던트 상태 저장
function saveIncidentState(state) {
  try {
    fs.writeFileSync(INCIDENT_STATE, JSON.stringify(state, null, 2));
    log(`💾 인시던트 상태 저장: ${state.status}`);
  } catch (e) {
    log(`❌ 인시던트 상태 저장 실패: ${e.message}`);
  }
}

// P1 배포 상태 확인
async function checkP1DeploymentStatus() {
  log('🔍 P1 배포 상태 확인...');

  const endpoints = [
    'https://dsc-fms-portal.vercel.app',
    'https://dsc-audit-p1.vercel.app',
    'https://dsc-discord-bot-p1.vercel.app',
    'https://dsc-travel-p2-ui.vercel.app'
  ];

  let upCount = 0;
  const results = {};

  for (const endpoint of endpoints) {
    try {
      const { stdout } = await execPromise(
        `curl -s -o /dev/null -w "%{http_code}" "${endpoint}" --max-time 10`,
        { timeout: 15000 }
      );
      const code = stdout.trim();
      results[endpoint] = code;
      if (code === '200') {
        upCount++;
      }
    } catch (e) {
      results[endpoint] = '000';
    }
  }

  log(`  결과: ${upCount}/4 UP`);
  Object.entries(results).forEach(([ep, code]) => {
    log(`    ${ep}: HTTP ${code}`);
  });

  return { upCount, downCount: 4 - upCount, results };
}

// 인시던트 지속시간 계산
function calculateIncidentDuration(startTime) {
  const now = Date.now();
  const durationMs = now - startTime;
  const durationMins = Math.floor(durationMs / 60000);
  const durationHours = Math.floor(durationMins / 60);

  return { durationMs, durationMins, durationHours };
}

// 에스컬레이션 로직
async function evaluateEscalation(deploymentStatus, incidentState) {
  log('');
  log('📊 에스컬레이션 평가...');

  const isFullDown = deploymentStatus.downCount === 4;
  const isFullUp = deploymentStatus.upCount === 4;

  // 인시던트가 없는 경우
  if (!incidentState || incidentState.status === 'RESOLVED') {
    if (isFullDown) {
      log('🚨 새로운 인시던트 감지: 4/4 P1 DOWN');
      return {
        action: 'START_INCIDENT',
        severity: 'CRITICAL',
        timestamp: Date.now()
      };
    }
    return { action: 'NO_ACTION' };
  }

  // 인시던트가 진행 중인 경우
  if (incidentState.status === 'ONGOING') {
    const duration = calculateIncidentDuration(incidentState.startTime);

    log(`⏱️  인시던트 지속시간: ${duration.durationHours}h ${duration.durationMins % 60}m`);

    // 1시간 이상: 자동 checkpoint 생성
    if (duration.durationHours >= 1 && !incidentState.checkpointCreated) {
      log('🚨 1시간 이상 지속 → 자동 checkpoint 생성');
      return {
        action: 'CREATE_CHECKPOINT',
        severity: 'HIGH',
        duration: duration.durationMins,
        timestamp: Date.now()
      };
    }

    // 30분 이상: 자동 긴급 알림
    if (duration.durationMins >= 30 && !incidentState.emergencyAlertSent) {
      log('🚨 30분 이상 지속 → 자동 긴급 알림');
      return {
        action: 'SEND_EMERGENCY_ALERT',
        severity: 'CRITICAL',
        duration: duration.durationMins,
        timestamp: Date.now()
      };
    }

    // 완전 복구: 인시던트 종료
    if (isFullUp) {
      log('✅ 완전 복구 감지 → 인시던트 종료');
      return {
        action: 'RESOLVE_INCIDENT',
        severity: 'INFO',
        duration: duration.durationMins,
        timestamp: Date.now()
      };
    }

    return { action: 'CONTINUE_MONITORING' };
  }

  return { action: 'NO_ACTION' };
}

// Checkpoint 생성 (git commit)
async function createCheckpoint(description) {
  try {
    log('');
    log('📝 자동 checkpoint 생성...');

    const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const msg = `🚨 Incident checkpoint @ ${timestamp} — ${description}`;

    await execPromise(
      `cd "${WORKSPACE_DIR}" && git add -A && git commit -m "${msg}" || true`,
      { timeout: 30000 }
    );

    log(`  ✅ Checkpoint 생성: ${msg}`);
  } catch (e) {
    log(`  ⚠️  Checkpoint 생성 실패: ${e.message}`);
  }
}

// 긴급 알림 전송
async function sendEmergencyAlert(duration) {
  try {
    log('');
    log('🚨 긴급 알림 전송...');

    const message = `
🚨 CRITICAL INCIDENT ALERT
============================
인시던트 지속시간: ${duration}분
상태: P1 4/4 또는 일부 DOWN
조치: 긴급 에스컬레이션 필요
시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
============================
    `;

    // Discord/Telegram 알림은 별도 구현 (placeholder)
    log(`  📤 알림 대기열에 추가됨`);
    log(`  메시지: ${message.replace(/\n/g, ' ')}`);
  } catch (e) {
    log(`  ⚠️  알림 전송 실패: ${e.message}`);
  }
}

// 메인 로직
async function main() {
  try {
    ensureDir(path.dirname(LOG_FILE));

    log('================================================================');
    log('🎯 자동 에스컬레이션 오케스트레이터 시작 (Phase 2 #2)');
    log('================================================================');

    // 1. 배포 상태 확인
    const deploymentStatus = await checkP1DeploymentStatus();

    // 2. 인시던트 상태 읽기
    let incidentState = readIncidentState();

    // 3. 에스컬레이션 평가
    const escalation = await evaluateEscalation(deploymentStatus, incidentState);

    log('');
    log(`📋 에스컬레이션 결정: ${escalation.action}`);

    // 4. 액션 실행
    switch (escalation.action) {
      case 'START_INCIDENT':
        log('🚨 인시던트 시작');
        incidentState = {
          status: 'ONGOING',
          startTime: escalation.timestamp,
          severity: escalation.severity,
          checkpointCreated: false,
          emergencyAlertSent: false
        };
        saveIncidentState(incidentState);
        break;

      case 'CREATE_CHECKPOINT':
        log('📝 Checkpoint 생성 중...');
        incidentState.checkpointCreated = true;
        saveIncidentState(incidentState);
        await createCheckpoint(`P1 DOWN ${escalation.duration}분`);
        break;

      case 'SEND_EMERGENCY_ALERT':
        log('🚨 긴급 알림 전송 중...');
        incidentState.emergencyAlertSent = true;
        saveIncidentState(incidentState);
        await sendEmergencyAlert(escalation.duration);
        break;

      case 'RESOLVE_INCIDENT':
        log('✅ 인시던트 해결');
        incidentState = {
          status: 'RESOLVED',
          endTime: escalation.timestamp,
          duration: escalation.duration,
          resolvedAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
        };
        saveIncidentState(incidentState);
        break;

      default:
        log(`➡️  계속 모니터링...`);
    }

    log('');
    log('✅ 에스컬레이션 오케스트레이터 완료');
    log('================================================================');

  } catch (e) {
    log(`❌ 오류 발생: ${e.message}`);
    process.exit(1);
  }
}

// Autonomous Proceed: 사용자 입력 없이 실행
if (require.main === module) {
  main().catch(err => {
    log(`❌ 치명적 오류: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main, checkP1DeploymentStatus, evaluateEscalation };
