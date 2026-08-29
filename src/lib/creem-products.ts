export type PaidPlanId = "starter" | "pro";

export const PAID_PLAN_CREDITS: Record<string, number> = {
  starter: 10,
  pro: 30,
};

export const PAID_PLAN_NAMES: Record<PaidPlanId, string> = {
  starter: "Starter Plan",
  pro: "Pro Plan",
};

const PRODUCT_ENV_VARS: Record<PaidPlanId, string> = {
  starter: "CREEM_STARTER_PRODUCT_ID",
  pro: "CREEM_PRO_PRODUCT_ID",
};

const PAID_PLAN_IDS: readonly PaidPlanId[] = ["starter", "pro"];

export function getCreemPlanProductId(planId: string): string | null {
  const plan = PAID_PLAN_IDS.find((candidate) => candidate === planId);
  if (!plan) return null;

  const productId = process.env[PRODUCT_ENV_VARS[plan]];
  return typeof productId === "string" && productId.trim() ? productId.trim() : null;
}

export function requireCreemProductId(planId: PaidPlanId): string {
  const productId = getCreemPlanProductId(planId);
  if (!productId) {
    throw new Error(`Missing Creem product environment variable: ${PRODUCT_ENV_VARS[planId]}`);
  }
  return productId;
}

export function getPlanIdForCreemProductId(productId: string): PaidPlanId | null {
  return PAID_PLAN_IDS.find((planId) => getCreemPlanProductId(planId) === productId) || null;
}

export function validateCreemProductsConfiguration(): string[] {
  return PAID_PLAN_IDS
    .filter((planId) => !getCreemPlanProductId(planId))
    .map((planId) => PRODUCT_ENV_VARS[planId]);
}
