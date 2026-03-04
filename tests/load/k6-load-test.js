/**
 * k6 Load Test — quadrant-calm
 * Based on Production Monitoring Guide Section 6
 *
 * Run: k6 run tests/load/k6-load-test.js
 * Install k6: https://k6.io/docs/getting-started/installation/
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const apiLatency = new Trend("api_latency_ms");

// --- SLA Thresholds (from Production Monitoring Guide §12) ---
export const options = {
  stages: [
    { duration: "1m", target: 20 },  // Ramp up to 20 VUs
    { duration: "3m", target: 20 },  // Hold at 20 VUs (baseline)
    { duration: "1m", target: 50 },  // Ramp to 50 VUs (peak simulation)
    { duration: "2m", target: 50 },  // Hold at peak
    { duration: "1m", target: 0 },   // Ramp down
  ],
  thresholds: {
    // p99 API response < 500ms (Guide §12: target)
    http_req_duration: ["p(99)<500", "p(50)<100"],
    // Error rate < 1% (Guide §2.2)
    http_req_failed: ["rate<0.01"],
    errors: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:5173";
const SUPABASE_URL = __ENV.SUPABASE_URL || "";

export default function () {
  // --- Test 1: Frontend availability ---
  const frontendRes = http.get(`${BASE_URL}/`);
  const frontendOk = check(frontendRes, {
    "frontend status 200": (r) => r.status === 200,
    "frontend loads in <2s": (r) => r.timings.duration < 2000,
  });
  errorRate.add(!frontendOk);
  apiLatency.add(frontendRes.timings.duration);

  sleep(1);

  // --- Test 2: Health check endpoint (Supabase function) ---
  if (SUPABASE_URL) {
    const healthRes = http.get(`${SUPABASE_URL}/functions/v1/healthz`, {
      headers: { "Content-Type": "application/json" },
    });
    const healthOk = check(healthRes, {
      "healthz status 200": (r) => r.status === 200,
      "healthz responds in <500ms": (r) => r.timings.duration < 500,
      "healthz returns ok": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.status === "ok";
        } catch {
          return false;
        }
      },
    });
    errorRate.add(!healthOk);
  }

  sleep(1);
}

export function handleSummary(data) {
  console.log("\n=== Load Test Summary ===");
  console.log(`Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Error rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
  console.log(`p50 latency: ${data.metrics.http_req_duration.values["p(50)"].toFixed(0)}ms`);
  console.log(`p99 latency: ${data.metrics.http_req_duration.values["p(99)"].toFixed(0)}ms`);

  const passed =
    data.metrics.http_req_duration.values["p(99)"] < 500 &&
    data.metrics.http_req_failed.values.rate < 0.01;

  console.log(`\nSLA Result: ${passed ? "✅ PASSED" : "❌ FAILED"}`);

  return {
    "tests/load/results/summary.json": JSON.stringify(data, null, 2),
  };
}
