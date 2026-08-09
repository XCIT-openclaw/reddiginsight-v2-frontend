// Shared fetch wrapper that routes through HTTPS_PROXY when configured.
// Falls back to direct connection if proxy is unreachable.
import { ProxyAgent } from 'undici';
import type { Dispatcher } from 'undici';

let _dispatcher: Dispatcher | undefined;
let _dispatcherChecked = false;
let _proxyFailed = false;

function getDispatcher(): Dispatcher | undefined {
  if (_dispatcherChecked) return _proxyFailed ? undefined : _dispatcher;
  _dispatcherChecked = true;
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
  if (!proxy) {
    console.log('[fetchProxy] No proxy configured, using direct connection');
    return undefined;
  }
  try {
    _dispatcher = new ProxyAgent({ uri: proxy, connectTimeout: 10000 });
    console.log('[fetchProxy] Proxy configured:', proxy);
  } catch (e: any) {
    console.warn('[fetchProxy] Failed to create ProxyAgent:', e.message);
  }
  return _dispatcher;
}

/** Returns true if the error indicates the proxy itself is unreachable */
function isProxyRefused(err: any): boolean {
  const msg = (err?.message || '').toLowerCase();
  const causeMsg = (err?.cause?.message || '').toLowerCase();
  // Connection refused, DNS failure, or timeout on proxy connection
  // UND_ERR_CONNECT_TIMEOUT, ECONNREFUSED, ENOTFOUND
  if (msg.includes('econnrefused') || causeMsg.includes('econnrefused')) return true;
  if (msg.includes('enotfound') || causeMsg.includes('enotfound')) return true;
  if (msg.includes('und_err_connect_timeout') || causeMsg.includes('und_err_connect_timeout')) return true;
  if (msg.includes('connect timeout') || causeMsg.includes('connect timeout')) return true;
  return false;
}

export async function fetchWithProxy(
  url: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const dispatcher = getDispatcher();
  const opts: any = { ...init };
  if (dispatcher && !_proxyFailed) opts.dispatcher = dispatcher;

  // Handle timeout via AbortController if requested
  let controller: AbortController | undefined;
  if (init?.timeoutMs && !init?.signal) {
    controller = new AbortController();
    const timeout = setTimeout(() => controller!.abort(), init.timeoutMs);
    opts.signal = controller.signal;
    try {
      return await _doFetch(url, opts);
    } finally {
      clearTimeout(timeout);
    }
  }

  return _doFetch(url, opts);
}

async function _doFetch(url: string, opts: any): Promise<Response> {
  // Try with proxy first
  if (opts.dispatcher && !_proxyFailed) {
    try {
      return await fetch(url, opts);
    } catch (e: any) {
      if (isProxyRefused(e)) {
        console.warn('[fetchProxy] Proxy failed (' + (e?.message || 'unknown') + '), falling back to direct');
        _proxyFailed = true;
        delete opts.dispatcher;
      } else {
        throw e;
      }
    }
  }
  // Direct connection (or retry after proxy failure)
  return fetch(url, opts);
}
