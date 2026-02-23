import { useEffect } from 'react';
import { monitoringStore } from './monitoring-store';

/**
 * Observes Web Vitals (LCP, FID, CLS, TTFB) using the PerformanceObserver API
 * and records them into the monitoring store. Runs once on mount.
 */
export function usePerformanceMonitor() {
  useEffect(() => {
    // --- Navigation Timing (TTFB) ---
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries.length > 0) {
      const nav = navEntries[0];
      monitoringStore.addMetric('TTFB', Math.round(nav.responseStart - nav.requestStart), 'ms');
      monitoringStore.addMetric(
        'DOM Interactive',
        Math.round(nav.domInteractive - nav.startTime),
        'ms'
      );
    }

    // --- Largest Contentful Paint (LCP) ---
    let lcpObserver: PerformanceObserver | null = null;
    try {
      lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) monitoringStore.addMetric('LCP', Math.round(last.startTime), 'ms');
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // PerformanceObserver not supported in this environment
    }

    // --- Cumulative Layout Shift (CLS) ---
    let clsObserver: PerformanceObserver | null = null;
    let clsScore = 0;
    try {
      clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const e = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!e.hadRecentInput && e.value) clsScore += e.value;
        }
        monitoringStore.addMetric('CLS', parseFloat(clsScore.toFixed(4)), 'score');
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // PerformanceObserver not supported
    }

    // --- First Input Delay (FID) ---
    let fidObserver: PerformanceObserver | null = null;
    try {
      fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const e = entry as PerformanceEntry & { processingStart?: number };
          if (e.processingStart) {
            monitoringStore.addMetric(
              'FID',
              Math.round(e.processingStart - e.startTime),
              'ms'
            );
          }
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch {
      // PerformanceObserver not supported
    }

    // --- localStorage read timing ---
    const lsStart = performance.now();
    localStorage.getItem('eisenhower-tasks');
    const lsDuration = performance.now() - lsStart;
    monitoringStore.addMetric('LocalStorage Read', parseFloat(lsDuration.toFixed(3)), 'ms');

    return () => {
      lcpObserver?.disconnect();
      clsObserver?.disconnect();
      fidObserver?.disconnect();
    };
  }, []);
}
