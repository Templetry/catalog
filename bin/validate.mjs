// Validates registry.json against reality.
//
// This file is what every `templetry list` in the world reads. A typo in a
// path or a form renamed upstream breaks every user at once, silently — the
// registry has no compiler to catch it. So the checks that matter are the
// ones that leave the file: each form is fetched from the repo and ref it
// declares, and its manifest is compared field by field.
import fs from "node:fs";

const KINDS = ["frontend", "backend", "database", "infra",
               "multiplatform", "android", "ios", "desktop", "cli"];
const STATUSES = ["ready", "preview", "deprecated"];
const TOKEN = process.env.GITHUB_TOKEN;

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const reg = JSON.parse(fs.readFileSync("registry.json", "utf8"));

// ---------- shape ----------

if (reg.schema_version !== 2) err(`schema_version is ${reg.schema_version}, expected 2`);
if (!Array.isArray(reg.parents) || !reg.parents.length) err("no parents");

const isKebab = (s) => s === s.toLowerCase() && !s.includes(" ") && !s.includes("_");
const seenParents = new Set();
const seenNames = new Set();

for (const p of reg.parents ?? []) {
  for (const k of ["key", "label", "repo", "ref", "forms"]) {
    if (!p[k]) err(`parent ${p.key ?? "?"}: missing ${k}`);
  }
  if (seenParents.has(p.key)) err(`duplicate parent key: ${p.key}`);
  seenParents.add(p.key);

  const seenForms = new Set();
  for (const f of p.forms ?? []) {
    const id = `${p.key}/${f.form}`;
    for (const k of ["form", "name", "path", "status", "description"]) {
      if (!f[k]) err(`${id}: missing ${k}`);
    }
    if (seenForms.has(f.form)) err(`${p.key}: duplicate form ${f.form}`);
    seenForms.add(f.form);
    if (seenNames.has(f.name)) err(`duplicate template name: ${f.name}`);
    seenNames.add(f.name);

    if (!STATUSES.includes(f.status)) err(`${id}: status "${f.status}" not one of ${STATUSES.join(", ")}`);

    // ADR-0017: kinds is a closed vocabulary — an open one stops being a
    // filter the moment two templates say the same thing differently.
    for (const k of f.kinds ?? []) {
      if (!KINDS.includes(k)) err(`${id}: kind "${k}" is not in the closed vocabulary`);
    }
    if (!f.kinds?.length) warn(`${id}: no kinds — invisible to every kind filter`);
    for (const field of ["languages", "frameworks"]) {
      for (const v of f[field] ?? []) {
        if (!isKebab(v)) err(`${id}: ${field} "${v}" is not kebab-case`);
      }
    }
  }
}

for (const pc of reg.pieces ?? []) {
  for (const k of ["name", "repo", "ref", "path"]) {
    if (!pc[k]) err(`piece ${pc.name ?? "?"}: missing ${k}`);
  }
}

// ---------- reality ----------

async function fetchText(repo, ref, path) {
  const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${ref}`;
  const headers = { accept: "application/vnd.github.raw" };
  if (TOKEN) headers.authorization = `Bearer ${TOKEN}`;
  const res = await fetch(url, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${res.status} fetching ${repo}/${path}@${ref}`);
  return res.text();
}

// Minimal reader: the three taxonomy fields are always inline flow arrays.
function field(txt, name) {
  for (const raw of txt.split("\n")) {
    const line = raw.trim();
    if (!line.startsWith(name + ":")) continue;
    let v = line.slice(name.length + 1).trim();
    if (v.startsWith("[") && v.endsWith("]")) v = v.slice(1, -1);
    return v.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return null;
}

const jobs = [];
for (const p of reg.parents ?? []) {
  for (const f of p.forms ?? []) {
    jobs.push({ id: `${p.key}/${f.form}`, repo: p.repo, ref: p.ref, path: `${f.path}/template.yml`, form: f });
  }
}
for (const pc of reg.pieces ?? []) {
  jobs.push({ id: `piece ${pc.name}`, repo: pc.repo, ref: pc.ref, path: `${pc.path}/piece.yml`, piece: pc });
}

const results = await Promise.all(jobs.map(async (j) => {
  try { return { j, txt: await fetchText(j.repo, j.ref, j.path) }; }
  catch (e) { return { j, error: e.message }; }
}));

for (const { j, txt, error } of results) {
  if (error) { err(`${j.id}: ${error}`); continue; }
  if (txt === null) { err(`${j.id}: ${j.repo}/${j.path}@${j.ref} does not exist`); continue; }

  if (j.piece) {
    const name = field(txt, "name")?.[0];
    if (name && name !== j.piece.name) err(`${j.id}: piece.yml says name "${name}"`);
    continue;
  }

  const name = field(txt, "name")?.[0];
  if (name && name !== j.form.name) err(`${j.id}: manifest name "${name}" but registry says "${j.form.name}"`);

  // The taxonomy exists to be filtered on. Two sources of truth that drift
  // give a filter that quietly hides templates, which is worse than none.
  for (const f of ["kinds", "languages", "frameworks"]) {
    const a = (field(txt, f) ?? []).join(", ");
    const b = (j.form[f] ?? []).join(", ");
    if (a !== b) err(`${j.id}: ${f} — manifest [${a}] vs registry [${b}]`);
  }
}

// ---------- the README describes the same thing ----------

const readme = fs.readFileSync("README.md", "utf8");
for (const p of reg.parents ?? []) {
  for (const f of p.forms ?? []) {
    if (!readme.includes("`" + f.form + "`")) {
      warn(`README does not mention form ${p.key}/${f.form}`);
    }
  }
}

// ---------- report ----------

for (const w of warnings) console.log(`::warning::${w}`);
for (const e of errors) console.log(`::error::${e}`);
console.log(`\n${jobs.length} entries checked · ${errors.length} errors · ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
