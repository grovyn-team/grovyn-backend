/**
 * httpOnly session cookie for admin JWT (not readable by frontend JS).
 * Browser sends it on credentialed requests to this API origin.
 */

export const ADMIN_SESSION_COOKIE = 'grovyn_admin_session';

function cookieOptions() {
  const domain = process.env.ADMIN_COOKIE_DOMAIN?.trim() || undefined;
  const sameSiteRaw = process.env.ADMIN_COOKIE_SAMESITE?.trim().toLowerCase();
  const sameSite = sameSiteRaw === 'none' ? 'none' : 'lax';
  let secure =
    process.env.ADMIN_COOKIE_SECURE === 'true' ||
    (process.env.ADMIN_COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production');
  if (sameSite === 'none') {
    secure = true;
  }
  const opts = {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
  };
  if (domain) opts.domain = domain;
  return opts;
}

/** @param {import('express').Response} res */
export function setAdminSessionCookie(res, token, maxAgeMs) {
  res.cookie(ADMIN_SESSION_COOKIE, token, {
    ...cookieOptions(),
    maxAge: maxAgeMs,
  });
}

/** @param {import('express').Response} res */
export function clearAdminSessionCookie(res) {
  res.clearCookie(ADMIN_SESSION_COOKIE, cookieOptions());
}

/**
 * Prefer httpOnly cookie; allow Authorization: Bearer for API clients / legacy.
 * @param {import('express').Request} req
 */
export function getAdminTokenFromRequest(req) {
  const fromCookie = req.cookies?.[ADMIN_SESSION_COOKIE];
  if (typeof fromCookie === 'string' && fromCookie.length > 0) {
    return fromCookie;
  }
  const header = req.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return null;
}
