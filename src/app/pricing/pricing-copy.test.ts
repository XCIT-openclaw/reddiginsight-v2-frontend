import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("paid plan prices disclose that listed prices are tax exclusive", () => {
  const source = readFileSync("src/app/pricing/page.tsx", "utf8");

  assert.match(source, /const TAX_EXCLUSIVE_LABEL = "Tax exclusive";/);
  assert.ok(source.includes("{TAX_EXCLUSIVE_LABEL}"));
});
