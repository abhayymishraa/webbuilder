import { test } from "node:test";
import assert from "node:assert/strict";
import { cacheFile, clearFileContentCache, getCachedFile } from "../lib/file-content-cache.ts";
import { clearSession, saveSession } from "../api/session.ts";

test("saved file cache stays bounded and private to its session/revision key", async t => {
  t.beforeEach(clearFileContentCache);
  t.after(clearFileContentCache);
  const file = { content: "hello", binary: false };
  const key = (session = "alice", revision = "r1") =>
    JSON.stringify([session, "project", revision, "README.md"]);

  await t.test("reuses content without crossing session or revision boundaries", () => {
    cacheFile(key(), file);
    assert.deepEqual(getCachedFile(key()), file);
    assert.equal(getCachedFile(key("bob")), undefined);
    assert.equal(getCachedFile(key("alice", "r2")), undefined);
  });
  await t.test("retains empty and binary results", () => {
    for (const result of [{ content: "", binary: false }, { content: null, binary: true }]) {
      cacheFile(key(), result);
      assert.deepEqual(getCachedFile(key()), result);
    }
  });
  await t.test("evicts old entries after 64 files", () => {
    for (let i = 0; i < 65; i++) cacheFile(String(i), file);
    assert.equal(getCachedFile("0"), undefined);
    assert.deepEqual(getCachedFile("1"), file);
    assert.deepEqual(getCachedFile("64"), file);
  });
  await t.test("bounds string storage to 2 MiB, including replacements", () => {
    const large = { content: "x".repeat(600_000), binary: false };
    cacheFile("a", large);
    cacheFile("a", file);
    cacheFile("b", large);
    assert.deepEqual(getCachedFile("a"), file);
    cacheFile("c", large);
    assert.equal(getCachedFile("a"), undefined);
    assert.equal(getCachedFile("b"), undefined);
    assert.deepEqual(getCachedFile("c"), large);
    cacheFile("oversized", { content: "x".repeat(1_048_577), binary: false });
    assert.equal(getCachedFile("oversized"), undefined);
  });
  await t.test("sign-out and a new login erase cached contents", () => {
    const old = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
      removeItem() {}, setItem() {},
    } });
    try {
      cacheFile(key(), file);
      clearSession();
      assert.equal(getCachedFile(key()), undefined);
      cacheFile(key(), file);
      saveSession({ access_token: "fixture", refresh_token: "fixture", token_type: "bearer" });
      assert.equal(getCachedFile(key()), undefined);
    } finally {
      if (old) Object.defineProperty(globalThis, "localStorage", old);
      else Reflect.deleteProperty(globalThis, "localStorage");
    }
  });
});
