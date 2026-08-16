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

export async function updateCreemCustomerMetadata(
  customerId: string,
  metadata: Record<string, unknown>
): Promise<unknown> {
  const queryPath = `/customers?customer_id=${encodeURIComponent(customerId)}`;

  try {
    return await creemRequest(queryPath, {
      method: "PATCH",
      body: JSON.stringify({ metadata }),
    });
  } catch (queryError) {
    // Fallback for API versions that accept customer_id in the body instead.
    return await creemRequest(`/customers`, {
      method: "PATCH",
      body: JSON.stringify({
        customer_id: customerId,
        metadata,
      }),
    });
  }
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
      update_behavior: payload.updateBehavior || "proration-charge-immediately",
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
