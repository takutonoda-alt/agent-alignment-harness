import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const logsDir = path.join(root, "logs");
const outDir = path.join(root, "rules", "generated");
const threshold = Number(process.env.RULE_PROMOTION_THRESHOLD ?? "3");

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

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const files = walk(logsDir);
const rows = files.map((f) => JSON.parse(fs.readFileSync(f, "utf8")));
const buckets = new Map();

for (const row of rows) {
  const key = `${row.mismatch_type}::${row.root_cause}`;
  const arr = buckets.get(key) ?? [];
  arr.push(row);
  buckets.set(key, arr);
}

fs.mkdirSync(outDir, { recursive: true });
let promoted = 0;

for (const [key, arr] of buckets.entries()) {
  if (arr.length < threshold) continue;
  const [mismatchType, rootCause] = key.split("::");
  const name = `${slugify(mismatchType)}-${slugify(rootCause).slice(0, 50)}`;
  const outPath = path.join(outDir, `${name}.md`);

  const lines = [];
  lines.push(`# ${mismatchType} rule`);
  lines.push("");
  lines.push(`- occurrences: ${arr.length}`);
  lines.push(`- root_cause: ${rootCause}`);
  lines.push("");
  lines.push("## Rule");
  lines.push(`- ${arr[0].preventive_rule}`);
  lines.push("");
  lines.push("## Evidence IDs");
  for (const row of arr) lines.push(`- ${row.id}`);

  fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
  promoted++;
}

console.log(`PROMOTION_DONE threshold=${threshold} promoted=${promoted}`);
