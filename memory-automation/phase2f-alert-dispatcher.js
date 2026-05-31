#!/usr/bin/env node

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL || '';
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || '';
const PORT = process.env.ALERT_PORT || 9000;

// Alert severity levels
const SEVERITY = { CRITICAL: 3, WARNING: 2, INFO: 1 };

// Log function
function log(level, msg) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${msg}`);
}

// Send Slack notification
async function sendSlack(alert) {
  if (!SLACK_WEBHOOK) return;

  const color = alert.severity === 'CRITICAL' ? '#FF0000' : '#FFA500';
  const payload = {
    attachments: [{
      color,
      title: `${alert.severity}: ${alert.name}`,
      text: alert.message,
      fields: [
        { title: 'Service', value: alert.service, short: true },
        { title: 'Severity', value: alert.severity, short: true },
        { title: 'Condition', value: alert.condition, short: false },
        { title: 'Timestamp', value: new Date().toISOString(), short: false }
      ],
      footer: 'Phase 2 Alert Dispatcher'
    }]
  };

  return new Promise((resolve) => {
    const options = new URL(SLACK_WEBHOOK);
    const req = https.request(options, { method: 'POST' }, (res) => {
      if (res.statusCode === 200) {
        log('INFO', `Slack notification sent: ${alert.name}`);
      } else {
        log('ERROR', `Slack notification failed: ${res.statusCode}`);
      }
      resolve();
    });
    req.on('error', (e) => log('ERROR', `Slack error: ${e.message}`));
    req.write(JSON.stringify(payload));
    req.end();
  });
}

// Send Discord notification
async function sendDiscord(alert) {
  if (!DISCORD_WEBHOOK) return;

  const color = alert.severity === 'CRITICAL' ? 16711680 : 16755200;
  const payload = {
    embeds: [{
      title: `${alert.severity}: ${alert.name}`,
      description: alert.message,
      color,
      fields: [
        { name: 'Service', value: alert.service, inline: true },
        { name: 'Severity', value: alert.severity, inline: true },
        { name: 'Condition', value: alert.condition, inline: false },
        { name: 'Timestamp', value: new Date().toISOString(), inline: false }
      ],
      footer: { text: 'Phase 2 Alert Dispatcher' }
    }]
  };

  return new Promise((resolve) => {
    const options = new URL(DISCORD_WEBHOOK);
    const req = https.request(options, { method: 'POST' }, (res) => {
      if (res.statusCode === 204) {
        log('INFO', `Discord notification sent: ${alert.name}`);
      } else {
        log('ERROR', `Discord notification failed: ${res.statusCode}`);
      }
      resolve();
    });
    req.on('error', (e) => log('ERROR', `Discord error: ${e.message}`));
    req.write(JSON.stringify(payload));
    req.end();
  });
}

// Alert router
async function routeAlert(alert) {
  log('INFO', `Routing alert: ${alert.name} (${alert.severity})`);

  if (alert.severity === 'CRITICAL') {
    await Promise.all([sendSlack(alert), sendDiscord(alert)]);
  } else if (alert.severity === 'WARNING') {
    await sendSlack(alert);
  }
}

// HTTP server
const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/alert') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const alert = JSON.parse(body);
        await routeAlert(alert);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'routed' }));
      } catch (e) {
        log('ERROR', `Failed to route alert: ${e.message}`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ready' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  log('INFO', `Alert Dispatcher listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  log('INFO', 'Shutting down gracefully...');
  server.close(() => process.exit(0));
});
