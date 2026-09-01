import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const projectRoot = new URL(".", import.meta.url);
const readPage = (relativePath: string) =>
  readFileSync(new URL(relativePath, projectRoot), "utf8");

test("keeps the dashboard screenshot on the guide and makes the home hero text-only", () => {
  const home = readPage("page.tsx");
  const guide = readPage("how-to-use/page.tsx");

  assert.ok(!home.includes("/images/guide/dashboard.png"));
  assert.ok(guide.includes("/images/guide/dashboard.png"));
});

test("uses the current guide image dimensions and a matching guide card width", () => {
  const guide = readPage("how-to-use/page.tsx");

  assert.match(guide, /image: '\/images\/guide\/chat\.png',\s*imageWidth: 1126,\s*imageHeight: 960,/);
  assert.match(
    guide,
    /<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">\s*<Card className="border-border\/40 bg-white\/90/
  );
});

for (const page of ["dashboard/layout.tsx", "reports/layout.tsx"]) {
  test(`uses the site gradient for every ${page.split("/")[0]} state`, () => {
    const source = readPage(page);
    const gradient =
      "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20";

    assert.equal(source.split(gradient).length - 1, 3);
    assert.ok(!source.includes("min-h-screen bg-background"));
  });
}
