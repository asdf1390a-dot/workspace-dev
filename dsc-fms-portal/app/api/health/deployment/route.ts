// Health check for both local and production (Vercel) deployment status
// This endpoint verifies: local build status, page count, and Vercel HTTP connectivity

import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

interface HealthCheckResult {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'critical';
  local: {
    build_status: 'passing' | 'failing';
    pages_count: number;
    pages_expected: number;
    build_output_path: string;
    build_time: string | null;
  };
  vercel: {
    deployment_url: string;
    http_status: number | null;
    reachable: boolean;
    error?: string;
  };
  services: {
    fms_portal: { port: number; status: 'running' | 'stopped' };
    phase2a: { port: number; status: 'running' | 'stopped' };
    phase2b: { port: number; status: 'running' | 'stopped' };
    phase2c: { port: number; status: 'running' | 'stopped' };
    gateway: { port: number; status: 'running' | 'stopped' };
  };
  alerts: string[];
}

async function getPageCount(): Promise<number> {
  try {
    const manifestPath = join(process.cwd(), '.next/server/pages-manifest.json');
    const content = readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);
    return Object.keys(manifest).length;
  } catch {
    return 0;
  }
}

function checkServicePort(port: number): 'running' | 'stopped' {
  try {
    execSync(`lsof -i :${port}`, { stdio: 'pipe' });
    return 'running';
  } catch {
    return 'stopped';
  }
}

async function checkVercelDeployment(url: string): Promise<{
  status: number | null;
  reachable: boolean;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return { status: response.status, reachable: response.status < 500 };
  } catch (error) {
    return {
      status: null,
      reachable: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET(): Promise<NextResponse<HealthCheckResult>> {
  const timestamp = new Date().toISOString();
  const alerts: string[] = [];

  // Check local build status
  let pagesCount = 0;
  let buildStatus: 'passing' | 'failing' = 'failing';
  let buildTime: string | null = null;

  try {
    pagesCount = await getPageCount();
    buildStatus = pagesCount > 0 ? 'passing' : 'failing';

    // Get last build time from .next directory
    try {
      const buildStatsPath = join(process.cwd(), '.next');
      const stats = execSync(`stat -c %y "${buildStatsPath}"`, { encoding: 'utf-8' });
      buildTime = stats.split('\n')[0];
    } catch {
      buildTime = null;
    }
  } catch {
    buildStatus = 'failing';
  }

  // Check service ports
  const services = {
    fms_portal: { port: 3000, status: checkServicePort(3000) },
    phase2a: { port: 3009, status: checkServicePort(3009) },
    phase2b: { port: 3010, status: checkServicePort(3010) },
    phase2c: { port: 3011, status: checkServicePort(3011) },
    gateway: { port: 19001, status: checkServicePort(19001) },
  };

  // Check Vercel deployment
  const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://dsc-fms-portal.vercel.app';

  const vercelCheck = await checkVercelDeployment(vercelUrl);

  // Determine overall status and generate alerts
  let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';

  if (buildStatus === 'failing') {
    alerts.push('Build is failing - no pages available');
    overallStatus = 'critical';
  }

  if (pagesCount < 130) {
    alerts.push(
      `Build regression detected: ${pagesCount} pages (expected ~140+). Check for deleted routes.`
    );
    if (overallStatus === 'healthy') overallStatus = 'degraded';
  }

  if (!vercelCheck.reachable) {
    alerts.push(
      `Vercel deployment unreachable (${vercelUrl}). HTTP status: ${vercelCheck.status || 'timeout'}. ${vercelCheck.error || ''}`
    );
    if (overallStatus === 'healthy' || overallStatus === 'degraded') {
      overallStatus = 'critical';
    }
  } else if (vercelCheck.status && vercelCheck.status >= 400) {
    alerts.push(`Vercel deployment returned HTTP ${vercelCheck.status}`);
    if (overallStatus === 'healthy') overallStatus = 'degraded';
  }

  const stoppedServices = Object.entries(services).filter(
    ([, { status }]) => status === 'stopped'
  );
  if (stoppedServices.length > 0) {
    alerts.push(
      `Services not running: ${stoppedServices.map(([name]) => name).join(', ')}`
    );
    if (overallStatus === 'healthy') overallStatus = 'degraded';
  }

  const result: HealthCheckResult = {
    timestamp,
    status: overallStatus,
    local: {
      build_status: buildStatus,
      pages_count: pagesCount,
      pages_expected: 140,
      build_output_path: join(process.cwd(), '.next'),
      build_time: buildTime,
    },
    vercel: {
      deployment_url: vercelUrl,
      http_status: vercelCheck.status,
      reachable: vercelCheck.reachable,
      error: vercelCheck.error,
    },
    services,
    alerts,
  };

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 202 : 500;
  return NextResponse.json(result, { status: statusCode });
}
