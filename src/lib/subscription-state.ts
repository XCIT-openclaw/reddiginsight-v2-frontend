// Temporary production switch: Creem plan-change calls currently return 403.
// Keep the implementation below intact and restore this flag after Creem resolves the endpoint.
export const PLAN_CHANGE_FEATURE_ENABLED = false;

export function shouldRejectPlanChangeAction(action: string): boolean {
  return !PLAN_CHANGE_FEATURE_ENABLED && (action === "upgrade" || action === "update");
}

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

  const body: Record<string, unknown> = {
    update_behavior: "proration-none",
  };

  if (input.targetProductId.trim()) {
    body.product_id = input.targetProductId;
  } else {
    body.plan_id = input.targetPlanId;
  }

  return {
    endpoint: "/api/subscriptions/upgrade",
    body,
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
