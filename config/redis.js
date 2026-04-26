import Redis from 'ioredis';

let client;

/**
 * Shared Redis client for OTP and short-lived auth state.
 * Lazily created; throws if REDIS_URL is missing when first used.
 */
export function getRedis() {
  if (!client) {
    const url = process.env.REDIS_URL;
    if (!url || !String(url).trim()) {
      throw new Error('REDIS_URL is not set');
    }
    client = new Redis(url.trim(), { maxRetriesPerRequest: 3 });
  }
  return client;
}
