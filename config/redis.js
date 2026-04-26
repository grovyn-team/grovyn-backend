/**
 * TCP Redis (ioredis) for long-running Node processes.
 * For Vercel/serverless, prefer UPSTASH_REDIS_REST_* via config/redisStore.js (used by admin auth).
 */
import Redis from 'ioredis';

let client;

/**
 * Trim .env noise: trailing commas, wrapping quotes (handles `"url",` mistakes).
 */
function trimEnv(s) {
  if (s == null) return '';
  let t = String(s).trim();
  t = t.replace(/,\s*$/, '');
  while (t.length >= 2 && ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))) {
    t = t.slice(1, -1).trim().replace(/,\s*$/, '');
  }
  return t;
}

/**
 * Resolve the connection string passed to ioredis.
 *
 * Supported:
 * - Local: redis://localhost:6379
 * - TLS / Upstash (recommended): paste full URL from Upstash → Connect → Redis, e.g.
 *   rediss://default:PASSWORD@endpoint.upstash.io:6379
 *   If the password contains @ or #, URL-encode it in this string (or use https + REDIS_TOKEN below).
 * - Upstash shortcut: REDIS_URL=https://*.upstash.io and REDIS_TOKEN=redis_password
 *   (REDIS_TOKEN is ignored when REDIS_URL is already redis:// or rediss://).
 */
function resolveRedisUrl(urlRaw, tokenRaw) {
  const url = trimEnv(urlRaw);
  const token = trimEnv(tokenRaw);

  if (!url) {
    throw new Error('REDIS_URL is not set');
  }

  if (/^https?:\/\//i.test(url)) {
    let hostname;
    try {
      hostname = new URL(url).hostname;
    } catch {
      throw new Error(
        'REDIS_URL is not a valid URL. Use redis:// or rediss://, or https://YOUR.upstash.io with REDIS_TOKEN.',
      );
    }

    if (hostname.endsWith('.upstash.io')) {
      if (!token) {
        throw new Error(
          'Upstash HTTPS URL detected: set REDIS_TOKEN to your Redis password (Upstash → Connect → Redis), ' +
            'or set REDIS_URL to the full rediss://default:PASSWORD@HOST:6379 string.',
        );
      }
      return `rediss://default:${encodeURIComponent(token)}@${hostname}:6379`;
    }

    throw new Error(
      'REDIS_URL must be redis:// or rediss:// (not https://), unless it is an *.upstash.io HTTPS endpoint ' +
        'with REDIS_TOKEN set to build the TLS Redis URL automatically.',
    );
  }

  if (!/^rediss?:\/\//i.test(url)) {
    throw new Error('REDIS_URL must start with redis:// or rediss:// (or https://*.upstash.io with REDIS_TOKEN).');
  }

  return url;
}

/**
 * Shared Redis client for OTP and short-lived auth state.
 */
export function getRedis() {
  if (!client) {
    const url = resolveRedisUrl(process.env.REDIS_URL, process.env.REDIS_TOKEN);

    client = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 10) return null;
        return Math.min(times * 200, 3000);
      },
    });

    client.on('error', (err) => {
      console.error('[redis]', err.message);
    });
  }
  return client;
}
