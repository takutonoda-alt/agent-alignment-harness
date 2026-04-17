import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const schemaPath = path.join(root, "schema", "failure-log.schema.json");
const logsDir = path.join(root, "logs");

const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

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
let failed = 0;

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const ok = validate(data);
  if (!ok) {
    failed++;
    console.error(`INVALID ${path.relative(root, file)}`);
    for (const err of validate.errors ?? []) {
      console.error(`  - ${err.instancePath || "/"} ${err.message}`);
    }
  }
}

if (failed > 0) {
  console.error(`VALIDATION_FAILED files=${failed}/${files.length}`);
  process.exit(1);
}

console.log(`VALIDATION_OK files=${files.length}`);
