import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const appRoot = new URL(".", import.meta.url);
const readPage = (relativePath: string) =>
  readFileSync(new URL(relativePath, appRoot), "utf8");

test("uses the updated free-credit offer on public pages", () => {
  const home = readPage("page.tsx");
  const guide = readPage("how-to-use/page.tsx");
  const updatedCopy = "Start with 1 free credit for 1 analysis report now.";

  assert.ok(home.includes(updatedCopy));
  assert.ok(guide.includes(updatedCopy));
  assert.ok(!home.includes("Start with 1 free credit. No credit card required."));
  assert.ok(!guide.includes("Start with 1 free credit. No credit card required."));
});

test("uses the clarified home-page API-key requirement", () => {
  const home = readPage("page.tsx");

  assert.ok(home.includes("'No LLM API key required'"));
  assert.ok(!home.includes("'No credit card required'"));
});
