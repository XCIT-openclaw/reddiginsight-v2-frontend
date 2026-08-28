import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import {
  buildPasswordResetRedirect,
  getSafeRedirectPath,
  parseResetEmail,
} from "./password-reset.ts";

test("validates reset-password email input", () => {
  assert.equal(parseResetEmail(" User@Example.com "), "user@example.com");
  assert.equal(parseResetEmail("not-an-email"), null);
  assert.equal(parseResetEmail(""), null);
});

test("builds a same-origin reset-password callback", () => {
  assert.equal(
    buildPasswordResetRedirect("https://reddiginsight.com"),
    "https://reddiginsight.com/auth/callback?next=%2Freset-password"
  );
});

test("only allows relative callback destinations", () => {
  assert.equal(getSafeRedirectPath("/reset-password"), "/reset-password");
  assert.equal(getSafeRedirectPath("/login?next=/dashboard"), "/login?next=/dashboard");
  assert.equal(getSafeRedirectPath("https://evil.example/dashboard"), "/dashboard");
  assert.equal(getSafeRedirectPath("https://evil.example"), "/dashboard");
  assert.equal(getSafeRedirectPath("//evil.example/dashboard"), "/dashboard");
});

test("defines the complete password-reset route surface", () => {
  assert.ok(existsSync("src/app/api/auth/forgot-password/route.ts"));
  assert.ok(existsSync("src/app/reset-password/page.tsx"));
});
