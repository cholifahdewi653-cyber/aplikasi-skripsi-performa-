/**
 * test/setupLogger.ts
 *
 * Dijalankan sebelum setiap test file (setupFilesAfterFramework).
 * Meng-intercept supertest responses agar:
 *  - Response sukses  → console.log dengan ✅ + data terformat
 *  - Response error   → console.log dengan ❌ + error JSON terformat
 *
 * Cara kerja: patch global `console` hanya untuk output yang kita kendalikan.
 * console.error dari errorHandler sudah dimatikan saat NODE_ENV=test.
 */

// ─── ANSI Color Helpers ───────────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  bgGreen: "\x1b[42m",
  bgRed: "\x1b[41m",
};

const statusColor = (status: number) => {
  if (status >= 200 && status < 300) return C.green;
  if (status >= 400 && status < 500) return C.yellow;
  return C.red;
};

const badge = (status: number) => {
  const sc = statusColor(status);
  return `${C.bold}${sc} ${status} ${C.reset}`;
};

function prettyJson(data: unknown, indent = 2): string {
  return JSON.stringify(data, null, indent);
}

// ─── Global Response Logger ────────────────────────────────────────────────────
// Kita patch supertest dengan afterEach agar setiap test yang selesai
// bisa kita lacak melalui beforeEach / afterEach hooks global Jest.

// Buffer untuk menyimpan log dalam 1 test
let _logs: string[] = [];

// Expose helper global untuk dipakai di test
(global as any).logResponse = (
  label: string,
  status: number,
  body: unknown,
) => {
  const isSuccess = status >= 200 && status < 300;
  const icon = isSuccess ? "✅" : "❌";
  const sc = statusColor(status);

  const line = [
    `${icon} ${C.bold}${label}${C.reset}  ${badge(status)}`,
    `${C.gray}${"─".repeat(60)}${C.reset}`,
    isSuccess
      ? `${C.green}${prettyJson(body)}${C.reset}`
      : `${C.yellow}${prettyJson(body)}${C.reset}`,
    "",
  ].join("\n");

  _logs.push(line);
};

// ─── Setup / Teardown per-test ─────────────────────────────────────────────────
beforeEach(() => {
  _logs = [];
});

afterEach(function () {
  // Ambil nama test dari Jest
  const testName =
    (expect as any).getState?.()?.currentTestName ?? "Unknown Test";

  if (_logs.length === 0) return;

  const header = `\n${C.bold}${C.cyan}▶ ${testName}${C.reset}`;
  process.stdout.write(header + "\n" + _logs.join("\n") + "\n");
});
