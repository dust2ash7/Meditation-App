// Run: node --test tests/
// Loads sw.js in a sandbox and checks the Range parser and the 206/416 responses built from a cached body.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const src = fs.readFileSync(path.join(__dirname, "..", "sw.js"), "utf8");
const sandbox = { self: { addEventListener() {}, location: { origin: "https://example.test" } }, caches: {}, Response, Blob, URL, Request, Map, Promise, Number, String, Math };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const { parseRange, rangeResponse } = sandbox;

test("parseRange: bounded, open-ended, suffix", () => {
  assert.deepStrictEqual({ ...parseRange("bytes=0-99", 1000) }, { start: 0, end: 99 });
  assert.deepStrictEqual({ ...parseRange("bytes=0-1", 1000) }, { start: 0, end: 1 });
  assert.deepStrictEqual({ ...parseRange("bytes=0-", 1000) }, { start: 0, end: 999 });
  assert.deepStrictEqual({ ...parseRange("bytes=539-", 1000) }, { start: 539, end: 999 });
  assert.deepStrictEqual({ ...parseRange("bytes=-100", 1000) }, { start: 900, end: 999 });
  assert.deepStrictEqual({ ...parseRange("bytes=-5000", 1000) }, { start: 0, end: 999 });
  assert.deepStrictEqual({ ...parseRange("bytes=900-5000", 1000) }, { start: 900, end: 999 });
  assert.deepStrictEqual({ ...parseRange(" Bytes=10-20 ", 1000) }, { start: 10, end: 20 });
});

test("parseRange: unsatisfiable -> null (416)", () => {
  assert.strictEqual(parseRange("bytes=1000-", 1000), null);
  assert.strictEqual(parseRange("bytes=1000-1001", 1000), null);
  assert.strictEqual(parseRange("bytes=-0", 1000), null);
  assert.strictEqual(parseRange("bytes=0-", 0), null);
});

test("parseRange: not understood -> undefined (serve full 200)", () => {
  assert.strictEqual(parseRange("bytes=-", 1000), undefined);
  assert.strictEqual(parseRange("bytes=20-10", 1000), undefined);
  assert.strictEqual(parseRange("bytes=0-1,5-6", 1000), undefined);
  assert.strictEqual(parseRange("items=0-1", 1000), undefined);
  assert.strictEqual(parseRange("", 1000), undefined);
});

const body = new Uint8Array(1000).map((_, i) => i % 256);
const cached = () => new Response(body, { status: 200, headers: { "Content-Type": "audio/mpeg" } });

test("rangeResponse: 206 slice with headers", async () => {
  const r = await rangeResponse(cached(), "bytes=539-");
  assert.strictEqual(r.status, 206);
  assert.strictEqual(r.headers.get("Content-Range"), "bytes 539-999/1000");
  assert.strictEqual(r.headers.get("Content-Length"), "461");
  assert.strictEqual(r.headers.get("Accept-Ranges"), "bytes");
  assert.strictEqual(r.headers.get("Content-Type"), "audio/mpeg");
  const got = new Uint8Array(await r.arrayBuffer());
  assert.strictEqual(got.length, 461);
  assert.strictEqual(got[0], 539 % 256);
  assert.strictEqual(got[460], 999 % 256);
});

test("rangeResponse: suffix and bytes=0-1 probe", async () => {
  const a = await rangeResponse(cached(), "bytes=-10");
  assert.strictEqual(a.headers.get("Content-Range"), "bytes 990-999/1000");
  assert.strictEqual((await a.arrayBuffer()).byteLength, 10);
  const b = await rangeResponse(cached(), "bytes=0-1");
  assert.strictEqual(b.status, 206);
  assert.strictEqual(b.headers.get("Content-Range"), "bytes 0-1/1000");
  assert.strictEqual((await b.arrayBuffer()).byteLength, 2);
});

test("rangeResponse: 416 when unsatisfiable", async () => {
  const r = await rangeResponse(cached(), "bytes=5000-");
  assert.strictEqual(r.status, 416);
  assert.strictEqual(r.headers.get("Content-Range"), "bytes */1000");
});

test("rangeResponse: unparseable header falls back to full 200", async () => {
  const r = await rangeResponse(cached(), "bytes=0-1,5-6");
  assert.strictEqual(r.status, 200);
  assert.strictEqual((await r.arrayBuffer()).byteLength, 1000);
});
