import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const logsDir = path.join(root, "logs");
const reportDir = path.join(root, "reports");
const reportPath = path.join(reportDir, "summary.md");

function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".json")) out.push(full);
  }
  return out;
}

const files = walk(logsDir);
const rows = files.map((f) => JSON.parse(fs.readFileSync(f, "utf8")));

const byType = new Map();
const bySeverity = new Map();
let totalMinutes = 0;

for (const row of rows) {
  byType.set(row.mismatch_type, (byType.get(row.mismatch_type) ?? 0) + 1);
  bySeverity.set(row.severity, (bySeverity.get(row.severity) ?? 0) + 1);
  totalMinutes += Number(row.cost?.minutes ?? 0);
}

const lines = [];
lines.push("# Failure Summary");
lines.push("");
lines.push(`- total_logs: ${rows.length}`);
lines.push(`- total_minutes: ${totalMinutes}`);
lines.push("");
lines.push("## By mismatch_type");
for (const [k, v] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
  lines.push(`- ${k}: ${v}`);
}
lines.push("");
lines.push("## By severity");
for (const [k, v] of [...bySeverity.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  lines.push(`- ${k}: ${v}`);
}

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
console.log(`SUMMARY_WRITTEN ${path.relative(root, reportPath)}`);
