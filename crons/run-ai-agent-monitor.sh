#!/bin/bash
# H2: AI Agent Status Monitor Executor
# Wrapper to invoke ai-agent-status-monitor.js from cron

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="$SCRIPT_DIR/ai-agent-status-monitor.js"

# Execute with node
/usr/bin/node "$NODE_SCRIPT" 2>&1

exit $?
