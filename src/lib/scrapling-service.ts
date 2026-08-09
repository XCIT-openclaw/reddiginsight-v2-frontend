// Shared helper: proxy requests to the Scrapling Python service
// deployed on Singapore Tencent Cloud server.
// Falls back to direct access if service is not configured or unreachable.

const SERVICE_URL = process.env.SCRAPLING_SERVICE_URL || '';

export function isServiceConfigured(): boolean {
  return !!SERVICE_URL;
}

export async function callScraplingService(
  endpoint: string,
  options?: { timeoutMs?: number }
): Promise<Response | null> {
  if (!SERVICE_URL) return null;

  const url = SERVICE_URL.replace(/\/+$/, '') + endpoint;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs || 15000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } catch (err: any) {
    console.warn('[scrapling-service] Call failed:', err.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
