import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("the root layout loads the Vercel Analytics script", () => {
  const source = readFileSync("src/app/layout.tsx", "utf8");

  assert.ok(source.includes('import { Analytics } from "@vercel/analytics/next";'));
  assert.ok(source.includes("<Analytics />"));
});
