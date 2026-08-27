import assert from "node:assert/strict";
import { test } from "node:test";
import {
  findActiveCreemSubscription,
  getCreemCheckoutSubscriptionId,
  getCreemSubscriptionCustomerEmail,
  getCreemSubscriptionUserId,
  getCreemRefundAmount,
  getCreemTransactionAmount,
  getCreemTransactionId,
  unwrapCreemTransaction,
  unwrapCreemSubscription,
} from "./creem.ts";

test("reads a paid transaction amount in minor units", () => {
  assert.equal(getCreemTransactionAmount({ amount: 990, status: "paid" }), 9.9);
});

test("reads alternate transaction amount fields", () => {
  assert.equal(getCreemTransactionAmount({ amount_paid: "2990", status: "paid" }), 29.9);
  assert.equal(getCreemTransactionAmount({ order: { amount: 990 }, status: "paid" }), 9.9);
});

test("reads the official Creem refund amount as negative dollars", () => {
  assert.equal(getCreemRefundAmount({ refund: { refund_amount: 2990 } }), -29.9);
  assert.equal(getCreemRefundAmount({ refund_amount: 1210 }), -12.1);
  assert.equal(getCreemRefundAmount({ transaction: { refund_amount: 990 } }), -9.9);
  assert.equal(getCreemRefundAmount({ refund: { refund_amount: 0 } }), null);
  assert.equal(getCreemRefundAmount({}), null);
});

test("reads transaction references nested in refund payloads", () => {
  assert.equal(getCreemTransactionId({ refund: { transaction_id: "tran_123" } }), "tran_123");
  assert.equal(
    getCreemTransactionId({ refund: { transaction: { id: "tran_456" } } }),
    "tran_456"
  );
});

test("returns null when no transaction amount is available", () => {
  assert.equal(getCreemTransactionAmount({ status: "paid" }), null);
});

test("reads subscription references from checkout payloads", () => {
  assert.equal(
    getCreemCheckoutSubscriptionId({ subscription: { id: "sub_object" } }),
    "sub_object"
  );
  assert.equal(
    getCreemCheckoutSubscriptionId({ subscription: "sub_string" }),
    "sub_string"
  );
  assert.equal(
    getCreemCheckoutSubscriptionId({ subscription_id: "sub_top_level" }),
    "sub_top_level"
  );
  assert.equal(getCreemCheckoutSubscriptionId({ id: "sub_event_object" }), "sub_event_object");
  assert.equal(getCreemCheckoutSubscriptionId({}), null);
});

test("unwraps transaction API response wrappers", () => {
  const expected = { id: "tran_123", amount: 990, status: "paid" };
  assert.equal(unwrapCreemTransaction({ data: expected }), expected);
  assert.equal(unwrapCreemTransaction({ items: [expected] }), expected);
  assert.equal(unwrapCreemTransaction({ object: expected }), expected);
  assert.equal(unwrapCreemTransaction(expected), expected);
});

test("unwraps subscription API responses and resolves user identity", () => {
  const expected = {
    id: "sub_terminal",
    status: "canceled",
    metadata: { user_id: "user-123" },
    customer: { id: "cust-123", email: "user@example.com" },
  };

  assert.equal(unwrapCreemSubscription({ data: expected }), expected);
  assert.equal(unwrapCreemSubscription({ items: [expected] }), expected);
  assert.equal(unwrapCreemSubscription({ object: expected }), expected);
  assert.equal(unwrapCreemSubscription(expected), expected);
  assert.equal(getCreemSubscriptionUserId({ data: expected }), "user-123");
  assert.equal(getCreemSubscriptionCustomerEmail({ object: expected }), "user@example.com");
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
