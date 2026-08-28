/**
 * Quick production smoke test. No secrets required.
 * Usage: npm run smoke
 *        npm run smoke -- https://psychopath-silk.vercel.app
 */
const base = (process.argv[2] || process.env.SMOKE_URL || "http://localhost:3001").replace(
  /\/$/,
  "",
);

async function check(path, validate) {
  const url = `${base}${path}`;
  const res = await fetch(url);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  const ok = res.ok && validate(body, res);
  console.log(ok ? "✓" : "✗", path, res.status);
  if (!ok) {
    console.log("  ", typeof body === "string" ? body.slice(0, 200) : body);
  }
  return ok;
}

let failed = 0;

if (
  !(await check("/", (_b, res) => res.headers.get("content-type")?.includes("text/html")))
) {
  failed++;
}

if (
  !(await check("/api/health", (b) => b && b.ok === true && b.configured === true && b.supabase === true))
) {
  failed++;
}

if (
  !(await check("/manifest.webmanifest", (b) => b && b.name === "PsychPath" && Array.isArray(b.icons)))
) {
  failed++;
}

if (
  !(await check("/serwist/sw.js", (_b, res) => res.headers.get("content-type")?.includes("javascript")))
) {
  failed++;
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed for ${base}`);
  process.exit(1);
}

console.log(`\nAll smoke checks passed for ${base}`);
