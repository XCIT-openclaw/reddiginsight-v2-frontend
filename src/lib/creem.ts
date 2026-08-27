export const DEFAULT_CREEM_API_URL = "https://test-api.creem.io/v1";

export type CreemUpdateBehavior =
  | "proration-charge-immediately"
  | "proration-charge"
  | "proration-none";

export interface CreemUpsertSubscriptionItem {
  id?: string;
  product_id?: string;
  price_id?: string;
  units?: number;
}

export interface CreemSubscriptionUpdatePayload {
  items: CreemUpsertSubscriptionItem[];
  updateBehavior?: CreemUpdateBehavior;
}

export interface CreemSubscriptionUpgradePayload {
  productId: string;
  updateBehavior?: CreemUpdateBehavior;
}

export interface CreemSubscriptionCancelPayload {
  mode?: "immediate" | "scheduled";
  onExecute?: "cancel" | "pause";
}

export class CreemApiError extends Error {
  status: number;
  details: string;

  constructor(message: string, status: number, details: string) {
    super(message);
    this.name = "CreemApiError";
    this.status = status;
    this.details = details;
  }
}

function getCreemApiBase(): string {
  return process.env.CREEM_API_URL || DEFAULT_CREEM_API_URL;
}

function getCreemApiKey(): string {
  const apiKey = process.env.CREEM_API_KEY;
  if (!apiKey || apiKey === "your-creem-api-key-here") {
    throw new CreemApiError(
      "Creem API key is not configured",
      500,
      "Set CREEM_API_KEY in the environment."
    );
  }
  return apiKey;
}

async function creemRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const apiKey = getCreemApiKey();
  const response = await fetch(getCreemApiBase() + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(15000),
  });

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const details =
      typeof data === "string"
        ? data
        : JSON.stringify(data || { message: response.statusText });
    throw new CreemApiError(
      "Creem API request failed",
      response.status,
      details
    );
  }

  return data as T;
}

export function getCreemCustomerId(payload: unknown): string | null {
  const candidates: unknown[] = [payload];
  const root = payload as Record<string, any> | null;
  if (root) {
    candidates.push(root.subscription, root.data, root.object);
  }

  for (const candidate of candidates) {
    const obj = candidate as Record<string, any> | null;
    if (!obj || typeof obj !== "object") continue;

    if (typeof obj.customer === "string") return obj.customer;
    if (obj.customer && typeof obj.customer.id === "string") return obj.customer.id;
    if (typeof obj.customer_id === "string") return obj.customer_id;
  }

  return null;
}

export function getCreemCheckoutSubscriptionId(payload: unknown): string | null {
  const root = payload as Record<string, any> | null;
  if (!root || typeof root !== "object") return null;

  if (typeof root.subscription === "string" && root.subscription.trim()) {
    return root.subscription.trim();
  }
  if (
    root.subscription &&
    typeof root.subscription === "object" &&
    typeof root.subscription.id === "string" &&
    root.subscription.id.trim()
  ) {
    return root.subscription.id.trim();
  }
  if (typeof root.subscription_id === "string" && root.subscription_id.trim()) {
    return root.subscription_id.trim();
  }

  if (typeof root.id === "string" && root.id.startsWith("sub_")) {
    return root.id;
  }

  return null;
}

export function getCreemTransactionId(payload: unknown): string | null {
  const candidates: unknown[] = [payload];
  const root = payload as Record<string, any> | null;
  if (root) {
    candidates.push(root.refund, root.transaction, root.payment, root.data, root.object);
  }

  for (const candidate of candidates) {
    if (typeof candidate === "string") return candidate;
    const obj = candidate as Record<string, any> | null;
    if (!obj || typeof obj !== "object") continue;

    if (obj.transaction && typeof obj.transaction.id === "string") return obj.transaction.id;
    if (typeof obj.transaction_id === "string") return obj.transaction_id;
    if (typeof obj.last_transaction_id === "string") return obj.last_transaction_id;
    if (typeof obj.payment_id === "string") return obj.payment_id;
    if (typeof obj.transaction === "string") return obj.transaction;
  }

  return null;
}

export function getCreemRefundAmount(payload: unknown): number | null {
  const root = payload as Record<string, any> | null;
  if (!root || typeof root !== "object") return null;

  const refund =
    root.refund && typeof root.refund === "object"
      ? (root.refund as Record<string, unknown>)
      : null;
  const transaction =
    root.transaction && typeof root.transaction === "object"
      ? (root.transaction as Record<string, unknown>)
      : null;

  const candidates: unknown[] = [
    refund?.refund_amount,
    root.refund_amount,
    transaction?.refund_amount,
    transaction?.amount,
    root.amount,
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value > 0) return -value / 100;
  }

  return null;
}

export function getCreemTransactionAmount(payload: unknown): number | null {
  const candidates: unknown[] = [payload];
  const root = payload as Record<string, any> | null;
  if (root) {
    candidates.push(root.transaction, root.order, root.data, root.object);
  }

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const record = candidate as Record<string, unknown>;
    for (const key of ["amount", "amount_paid", "paid_amount"]) {
      const value = Number(record[key]);
      if (Number.isFinite(value) && value > 0) return value / 100;
    }
  }

  return null;
}

export function unwrapCreemTransaction(
  payload: Record<string, any> | null
): Record<string, any> | null {
  if (!payload) return null;
  const wrappers: unknown[] = [payload.data, payload.items, payload.object];

  for (const wrapper of wrappers) {
    if (Array.isArray(wrapper)) {
      const transaction = wrapper.find((item) => item && typeof item === "object");
      if (transaction) return transaction as Record<string, any>;
      continue;
    }
    if (wrapper && typeof wrapper === "object") {
      return wrapper as Record<string, any>;
    }
  }

  if (!Array.isArray(payload) && typeof payload === "object") {
    return payload;
  }
  return null;
}

export async function getCreemTransaction(
  transactionId: string
): Promise<Record<string, any> | null> {
  const data = await creemRequest<Record<string, any> | null>(
    `/transactions?transaction_id=${encodeURIComponent(transactionId)}`
  );
  return unwrapCreemTransaction(data);
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "paused",
  "scheduled_cancel",
  "unpaid",
]);

export function findActiveCreemSubscription(payload: unknown): Record<string, any> | null {
  const visit = (value: unknown, depth = 0): Record<string, any> | null => {
    if (!value || depth > 5) return null;

    if (Array.isArray(value)) {
      for (const item of value) {
        const subscription = visit(item, depth + 1);
        if (subscription) return subscription;
      }
      return null;
    }

    if (typeof value !== "object") return null;
    const record = value as Record<string, any>;
    if (
      typeof record.id === "string" &&
      typeof record.status === "string" &&
      ACTIVE_SUBSCRIPTION_STATUSES.has(record.status)
    ) {
      return record;
    }

    return (
      visit(record.data, depth + 1) ||
      visit(record.items, depth + 1) ||
      visit(record.object, depth + 1)
    );
  };

  return visit(payload);
}

export function unwrapCreemSubscription(
  payload: Record<string, any> | null
): Record<string, any> | null {
  if (!payload) return null;
  const wrappers: unknown[] = [payload.data, payload.items, payload.object];

  for (const wrapper of wrappers) {
    if (Array.isArray(wrapper)) {
      const subscription = wrapper.find((item) => item && typeof item === "object");
      if (subscription) return subscription as Record<string, any>;
      continue;
    }
    if (wrapper && typeof wrapper === "object") {
      return wrapper as Record<string, any>;
    }
  }

  if (!Array.isArray(payload) && typeof payload === "object") return payload;
  return null;
}

export async function getCreemSubscription(
  subscriptionId: string
): Promise<Record<string, any> | null> {
  const data = await creemRequest<Record<string, any> | null>(
    `/subscriptions?subscription_id=${encodeURIComponent(subscriptionId)}`
  );
  return unwrapCreemSubscription(data);
}

export function getCreemSubscriptionUserId(payload: unknown): string | null {
  const subscription = unwrapCreemSubscription(payload as Record<string, any> | null);
  const metadata = subscription?.metadata;
  if (!metadata || typeof metadata !== "object") return null;
  const userId = metadata.user_id || metadata.userId;
  return typeof userId === "string" && userId.trim() ? userId.trim() : null;
}

export function getCreemSubscriptionCustomerEmail(payload: unknown): string | null {
  const subscription = unwrapCreemSubscription(payload as Record<string, any> | null);
  const email = subscription?.customer?.email || subscription?.customer_email;
  return typeof email === "string" && email.trim() ? email.trim() : null;
}

export async function listCreemCustomerSubscriptions(
  customerId: string
): Promise<unknown> {
  return await creemRequest<unknown>(
    `/customers/${encodeURIComponent(customerId)}/subscriptions`
  );
}

export async function getCreemCustomer(
  customerId: string
): Promise<Record<string, any> | null> {
  const customer = await creemRequest<Record<string, any> | null>(
    `/customers?customer_id=${encodeURIComponent(customerId)}`
  );
  if (!customer) return null;
  if (customer.data && !Array.isArray(customer.data)) return customer.data;
  return customer;
}

export async function updateCreemCustomerMetadata(
  customerId: string,
  metadata: Record<string, unknown>
): Promise<unknown> {
  const customer = await getCreemCustomer(customerId);
  const existingMetadata =
    customer && typeof customer.metadata === "object" && customer.metadata !== null
      ? customer.metadata
      : {};
  const completeMetadata = {
    ...existingMetadata,
    ...metadata,
    synced_at: new Date().toISOString(),
  };

  return await creemRequest("/customers", {
    method: "PATCH",
    body: JSON.stringify({
      customer_id: customerId,
      metadata: completeMetadata,
    }),
  });
}

export async function findCreemCustomerIdByEmail(email: string): Promise<string | null> {
  const data = await creemRequest<Record<string, any> | null>(
    `/customers?email=${encodeURIComponent(email)}`
  );

  if (!data) return null;
  const candidates: unknown[] = [data];
  if (data.data) candidates.push(data.data);
  if (data.items) candidates.push(data.items);

  for (const candidate of candidates) {
    if (typeof candidate === "string") return candidate;
    if (Array.isArray(candidate)) {
      const customerId = getCreemCustomerId(candidate[0]);
      if (customerId) return customerId;
      continue;
    }
    const customerId = getCreemCustomerId(candidate);
    if (customerId) return customerId;
  }

  const customer = Array.isArray(data) ? data[0] : data;
  if (!customer) return null;
  if (typeof customer.id === "string") return customer.id;
  return getCreemCustomerId(customer);
}

export async function updateCreemCustomerMetadataByEmail(
  email: string,
  metadata: Record<string, unknown>
): Promise<unknown | null> {
  const customerId = await findCreemCustomerIdByEmail(email);
  if (!customerId) return null;
  return updateCreemCustomerMetadata(customerId, metadata);
}

export async function updateCreemSubscription(
  subscriptionId: string,
  payload: CreemSubscriptionUpdatePayload
): Promise<unknown> {
  return creemRequest(`/subscriptions/${subscriptionId}`, {
    method: "POST",
    body: JSON.stringify({
      items: payload.items,
      update_behavior: payload.updateBehavior || "proration-none",
    }),
  });
}

export async function upgradeCreemSubscription(
  subscriptionId: string,
  payload: CreemSubscriptionUpgradePayload
): Promise<unknown> {
  return creemRequest(`/subscriptions/${subscriptionId}/upgrade`, {
    method: "POST",
    body: JSON.stringify({
      product_id: payload.productId,
      update_behavior: payload.updateBehavior || "proration-none",
    }),
  });
}

export async function cancelCreemSubscription(
  subscriptionId: string,
  payload: CreemSubscriptionCancelPayload = {}
): Promise<unknown> {
  const body: Record<string, string> = {
    mode: payload.mode || "scheduled",
  };
  if (payload.onExecute) {
    body.onExecute = payload.onExecute;
  }
  return creemRequest(`/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function pauseCreemSubscription(
  subscriptionId: string
): Promise<unknown> {
  return creemRequest(`/subscriptions/${subscriptionId}/pause`, {
    method: "POST",
  });
}

export async function resumeCreemSubscription(
  subscriptionId: string
): Promise<unknown> {
  return creemRequest(`/subscriptions/${subscriptionId}/resume`, {
    method: "POST",
  });
}
