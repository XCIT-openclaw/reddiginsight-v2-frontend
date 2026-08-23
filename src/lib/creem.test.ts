import assert from "node:assert/strict";
import { test } from "node:test";
import { findActiveCreemSubscription, getCreemTransactionAmount, unwrapCreemTransaction } from "./creem.ts";

test("reads a paid transaction amount in minor units", () => {
  assert.equal(getCreemTransactionAmount({ amount: 990, status: "paid" }), 9.9);
});

test("reads alternate transaction amount fields", () => {
  assert.equal(getCreemTransactionAmount({ amount_paid: "2990", status: "paid" }), 29.9);
  assert.equal(getCreemTransactionAmount({ order: { amount: 990 }, status: "paid" }), 9.9);
});

test("returns null when no transaction amount is available", () => {
  assert.equal(getCreemTransactionAmount({ status: "paid" }), null);
});

test("unwraps transaction API response wrappers", () => {
  const expected = { id: "tran_123", amount: 990, status: "paid" };
  assert.equal(unwrapCreemTransaction({ data: expected }), expected);
  assert.equal(unwrapCreemTransaction({ items: [expected] }), expected);
  assert.equal(unwrapCreemTransaction({ object: expected }), expected);
  assert.equal(unwrapCreemTransaction(expected), expected);
});

test("finds an active Creem customer subscription across response wrappers", () => {
  const active = { id: "sub_active", status: "active" };
  const scheduled = { id: "sub_scheduled", status: "scheduled_cancel" };
  assert.equal(findActiveCreemSubscription(active), active);
  assert.equal(findActiveCreemSubscription({ data: [active] }), active);
  assert.equal(findActiveCreemSubscription({ items: [active] }), active);
  assert.equal(findActiveCreemSubscription({ items: [scheduled] }), scheduled);
  assert.equal(findActiveCreemSubscription({ object: { data: [active] } }), active);
});

test("does not treat terminal subscriptions as active", () => {
  assert.equal(findActiveCreemSubscription({ data: [
    { id: "sub_canceled", status: "canceled" },
    { id: "sub_expired", status: "expired" },
  ] }), null);
  assert.equal(findActiveCreemSubscription(null), null);
});
