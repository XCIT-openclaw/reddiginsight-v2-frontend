import assert from "node:assert/strict";
import { test } from "node:test";
import * as subscriptionState from "./subscription-state.ts";

const { shouldResetUserAfterTerminalSubscription } = subscriptionState;

test("builds the correct API request for upgrades and downgrades", () => {
  const buildPlanChangeRequest = (
    subscriptionState as { buildPlanChangeRequest?: unknown }
  ).buildPlanChangeRequest;
  assert.equal(typeof buildPlanChangeRequest, "function");

  const upgrade = buildPlanChangeRequest as (
    request: Parameters<
      typeof subscriptionState.buildPlanChangeRequest
    >[0]
  ) => ReturnType<typeof subscriptionState.buildPlanChangeRequest>;

  assert.deepEqual(
    upgrade({
      currentPlanId: "starter",
      targetPlanId: "pro",
      targetProductId: "prod_pro",
    }),
    {
      endpoint: "/api/subscriptions/upgrade",
      body: {
        product_id: "prod_pro",
        update_behavior: "proration-none",
      },
    }
  );

  assert.deepEqual(
    upgrade({
      currentPlanId: "pro",
      targetPlanId: "starter",
      targetProductId: "prod_starter",
    }),
    {
      endpoint: "/api/subscriptions/update",
      body: {
        items: [{ product_id: "prod_starter" }],
        update_behavior: "proration-none",
      },
    }
  );
});

test("allows a terminal reset when the user has no active subscription row", () => {
  assert.equal(shouldResetUserAfterTerminalSubscription([]), true);
  assert.equal(
    shouldResetUserAfterTerminalSubscription([
      { id: "row-1", status: "canceled", creem_subscription_id: "sub_old" },
    ]),
    true
  );
});

test("blocks a terminal reset when another active subscription remains", () => {
  assert.equal(
    shouldResetUserAfterTerminalSubscription([
      { id: "row-1", status: "canceled", creem_subscription_id: "sub_old" },
      { id: "row-2", status: "active", creem_subscription_id: "sub_new" },
    ]),
    false
  );
});

test("ignores the terminal subscription when checking remaining entitlements", () => {
  assert.equal(
    shouldResetUserAfterTerminalSubscription(
      [{ id: "row-1", status: "unpaid", creem_subscription_id: "sub_terminal" }],
      "sub_terminal"
    ),
    true
  );
  assert.equal(
    shouldResetUserAfterTerminalSubscription(
      [
        { id: "row-1", status: "unpaid", creem_subscription_id: "sub_terminal" },
        { id: "row-2", status: "unpaid", creem_subscription_id: "sub_other" },
      ],
      "sub_terminal"
    ),
    false
  );
});

test("counts retry and scheduled states as active", () => {
  for (const status of ["trialing", "past_due", "paused", "scheduled_cancel", "unpaid"]) {
    assert.equal(
      shouldResetUserAfterTerminalSubscription([
        { id: "row-1", status, creem_subscription_id: "sub_new" },
      ]),
      false
    );
  }
});
