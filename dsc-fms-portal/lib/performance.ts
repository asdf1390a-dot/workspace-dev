export function measurePerformance(label: string) {
  const startTime = Date.now();
  
  return {
    end: () => {
      const duration = Date.now() - startTime;
      if (typeof window === 'undefined') {
        // Server-side
        console.log(`[PERF] ${label}: ${duration}ms`);
      }
      return duration;
    },
  };
}

export function captureMetric(name: string, value: number) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    try {
      window.performance.measure(name, { detail: { value } } as any);
    } catch (e) {
      // Ignore
    }
  }
}
