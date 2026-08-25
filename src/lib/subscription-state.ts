type PaidPlanId = "starter" | "pro";

export interface SubscriptionPlanChangeInput {
  currentPlanId: PaidPlanId;
  targetPlanId: PaidPlanId;
  targetProductId: string;
}

export interface SubscriptionPlanChangeRequest {
  endpoint: "/api/subscriptions/upgrade";
  body: Record<string, unknown>;
}

export interface SubscriptionStateSnapshot {
  id: string;
  status: string | null;
  creem_subscription_id?: string | null;
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "paused",
  "scheduled_cancel",
  "unpaid",
]);

export function buildPlanChangeRequest(
  input: SubscriptionPlanChangeInput
): SubscriptionPlanChangeRequest {
  const isUpgrade =
    input.currentPlanId === "starter" && input.targetPlanId === "pro";
  const isDowngrade =
    input.currentPlanId === "pro" && input.targetPlanId === "starter";

  if (!isUpgrade && !isDowngrade) {
    throw new Error("Invalid subscription plan change direction");
  }

  return {
    endpoint: "/api/subscriptions/upgrade",
    body: {
      product_id: input.targetProductId,
      update_behavior: "proration-none",
    },
  };
}

export function shouldResetUserAfterTerminalSubscription(
  subscriptions: SubscriptionStateSnapshot[],
  terminalCreemSubscriptionId?: string | null
): boolean {
  return !subscriptions.some((subscription) => {
    if (
      terminalCreemSubscriptionId &&
      subscription.creem_subscription_id === terminalCreemSubscriptionId
    ) {
      return false;
    }

    const status = subscription.status || "";
    return ACTIVE_SUBSCRIPTION_STATUSES.has(status);
  });
}
