import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("paid plan prices keep tax disclosure on the price line", () => {
  const source = readFileSync("src/app/pricing/page.tsx", "utf8");

  assert.match(source, /const TAX_EXCLUSIVE_LABEL = "\(Tax exclusive\)";/);
  assert.ok(
    source.includes(
      '<span className="ml-1 text-xs text-muted-foreground">{TAX_EXCLUSIVE_LABEL}</span>'
    )
  );
  assert.ok(!source.includes('mt-1 text-xs text-muted-foreground">{TAX_EXCLUSIVE_LABEL}'));
  assert.ok(source.includes('<CardFooter className="flex-col">'));
});
