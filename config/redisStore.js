import { Redis as UpstashRedis } from '@upstash/redis';
import { getRedis } from './redis.js';

function trimEnv(s) {
  if (s == null) return '';
  let t = String(s).trim();
  t = t.replace(/,\s*$/, '');
  while (t.length >= 2 && ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))) {
    t = t.slice(1, -1).trim().replace(/,\s*$/, '');
  }
  return t;
}

/** Prefer REST on Vercel / serverless; TCP (ioredis) for long-running Node. */
export function usesUpstashRest() {
  const url = trimEnv(process.env.UPSTASH_REDIS_REST_URL);
  const token = trimEnv(process.env.UPSTASH_REDIS_REST_TOKEN);
  return Boolean(url && token);
}

let upstashClient;

function getUpstash() {
  if (!upstashClient) {
    const url = trimEnv(process.env.UPSTASH_REDIS_REST_URL);
    const token = trimEnv(process.env.UPSTASH_REDIS_REST_TOKEN);
    if (!url || !token) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set');
    }
    upstashClient = new UpstashRedis({ url, token });
  }
  return upstashClient;
}

/**
 * Ensures either Upstash REST or REDIS_URL (ioredis) is configured.
 */
export function ensureRedisConfigured() {
  if (usesUpstashRest()) {
    getUpstash();
    return;
  }
  getRedis();
}

export async function redisSet(key, value, exSeconds) {
  if (usesUpstashRest()) {
    const r = getUpstash();
    if (exSeconds != null) await r.set(key, value, { ex: exSeconds });
    else await r.set(key, value);
    return;
  }
  const r = getRedis();
  if (exSeconds != null) await r.set(key, value, 'EX', exSeconds);
  else await r.set(key, value);
}

export async function redisGet(key) {
  if (usesUpstashRest()) return getUpstash().get(key);
  return getRedis().get(key);
}

export async function redisDel(...keyList) {
  const keys = keyList.flat().filter(Boolean);
  if (keys.length === 0) return;
  if (usesUpstashRest()) {
    const r = getUpstash();
    await Promise.all(keys.map((k) => r.del(k)));
    return;
  }
  await getRedis().del(...keys);
}

export async function redisTtl(key) {
  if (usesUpstashRest()) return getUpstash().ttl(key);
  return getRedis().ttl(key);
}
