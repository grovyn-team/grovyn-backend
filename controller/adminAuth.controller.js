import { randomInt } from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import AdminUser from '../models/AdminUser.js';
import {
  ensureRedisConfigured,
  redisSet,
  redisGet,
  redisDel,
  redisTtl,
} from '../config/redisStore.js';
import { sendAdminLoginOtpEmail, sendAdminPasswordResetOtpEmail } from '../services/adminEmail.js';

const NS = 'grovyn:admin';
const OTP_TTL_SEC = 300;
const LOGIN_CHALLENGE_TTL_SEC = 600;
const RESET_VERIFIED_TTL_SEC = 600;
const OTP_RESEND_COOLDOWN_SEC = 60;
const SALT_ROUNDS = 10;
const MIN_PASSWORD_LEN = 8;

function keys(emailKey) {
  return {
    loginChallenge: `${NS}:login:challenge:${emailKey}`,
    loginOtp: `${NS}:login:otp:${emailKey}`,
    loginOtpCooldown: `${NS}:login:otp:cooldown:${emailKey}`,
    resetOtp: `${NS}:reset:otp:${emailKey}`,
    resetCooldown: `${NS}:reset:cooldown:${emailKey}`,
    resetVerified: `${NS}:reset:verified:${emailKey}`,
  };
}

function normalizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

function generateOtp() {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

/** Redis/Upstash may return string or number for digit-only values; normalize before compare. */
function otpEquals(stored, input) {
  if (stored == null || input == null) return false;
  return String(stored).trim() === String(input).trim();
}

function jwtSecret() {
  const s = process.env.ADMIN_JWT_SECRET;
  if (!s?.trim()) return null;
  return s.trim();
}

function assertOtpStack() {
  ensureRedisConfigured();
  if (!process.env.RESEND_API_KEY?.trim()) {
    throw new Error('RESEND_API_KEY is not set');
  }
}

export async function adminBootstrap(req, res) {
  try {
    const secret = jwtSecret();
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'ADMIN_JWT_SECRET is not configured.',
      });
    }

    const setup = process.env.ADMIN_SETUP_SECRET;
    if (!setup?.trim()) {
      return res.status(503).json({
        success: false,
        message: 'Bootstrap is disabled. Set ADMIN_SETUP_SECRET to create the first admin.',
      });
    }

    const { email, password, setupSecret } = req.body || {};
    const incoming = typeof setupSecret === 'string' ? setupSecret.trim() : '';
    const expected = String(setup).trim();
    if (!incoming || incoming !== expected) {
      return res.status(403).json({ success: false, message: 'Invalid setup secret.' });
    }

    const emailKey = normalizeEmail(email);
    if (!emailKey || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid email and password are required.' });
    }
    if (password.length < MIN_PASSWORD_LEN) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LEN} characters.`,
      });
    }

    const existing = await AdminUser.countDocuments();
    if (existing > 0) {
      return res.status(400).json({
        success: false,
        message: 'An admin account already exists. Bootstrap is only for empty databases.',
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await AdminUser.create({ email: emailKey, passwordHash });

    return res.status(201).json({
      success: true,
      message: 'First admin created. You can sign in with email, password, and email OTP.',
    });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ success: false, message: 'That email is already registered.' });
    }
    console.error('adminBootstrap', e);
    return res.status(500).json({ success: false, message: 'Bootstrap failed.' });
  }
}

/**
 * Step 1: verify password, send login OTP (no JWT yet).
 */
export async function adminLogin(req, res) {
  try {
    const secret = jwtSecret();
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'ADMIN_JWT_SECRET is not configured.',
      });
    }

    try {
      assertOtpStack();
    } catch (cfgErr) {
      return res.status(500).json({ success: false, message: cfgErr.message });
    }

    const { email, password } = req.body || {};
    const emailKey = normalizeEmail(email);
    if (!emailKey || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await AdminUser.findOne({ email: emailKey });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const k = keys(emailKey);
    const otp = generateOtp();

    await redisSet(k.loginChallenge, '1', LOGIN_CHALLENGE_TTL_SEC);
    await redisSet(k.loginOtp, otp, OTP_TTL_SEC);

    try {
      await sendAdminLoginOtpEmail(user.email, otp);
    } catch (mailErr) {
      await redisDel(k.loginChallenge, k.loginOtp);
      console.error('adminLogin email', mailErr);
      return res.status(502).json({
        success: false,
        message: 'Could not send sign-in code. Check email configuration.',
      });
    }

    return res.status(200).json({
      success: true,
      step: 'otp_required',
      message: 'Check your email for a sign-in code.',
    });
  } catch (e) {
    console.error('adminLogin', e);
    return res.status(500).json({ success: false, message: 'Login failed.' });
  }
}

/**
 * Step 2: verify email OTP, issue JWT.
 */
export async function adminVerifyLoginOtp(req, res) {
  try {
    const secret = jwtSecret();
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'ADMIN_JWT_SECRET is not configured.',
      });
    }

    const { email, otp } = req.body || {};
    const emailKey = normalizeEmail(email);
    const code = typeof otp === 'string' ? otp.trim() : '';

    if (!emailKey || !code) {
      return res.status(400).json({ success: false, message: 'Email and code are required.' });
    }

    const k = keys(emailKey);

    const challenge = await redisGet(k.loginChallenge);
    if (!challenge) {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Sign in again with your password.',
      });
    }

    const stored = await redisGet(k.loginOtp);
    if (!otpEquals(stored, code)) {
      return res.status(401).json({ success: false, message: 'Invalid or expired code.' });
    }

    const user = await AdminUser.findOne({ email: emailKey });
    if (!user || !user.isActive) {
      await redisDel(k.loginChallenge, k.loginOtp, k.loginOtpCooldown);
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    await redisDel(k.loginChallenge, k.loginOtp, k.loginOtpCooldown);

    const token = jwt.sign({ role: 'admin', sub: user.email }, secret, { expiresIn: '7d' });

    return res.status(200).json({
      success: true,
      data: { token },
    });
  } catch (e) {
    console.error('adminVerifyLoginOtp', e);
    return res.status(500).json({ success: false, message: 'Verification failed.' });
  }
}

export async function adminResendLoginOtp(req, res) {
  try {
    try {
      assertOtpStack();
    } catch (cfgErr) {
      return res.status(500).json({ success: false, message: cfgErr.message });
    }

    const { email } = req.body || {};
    const emailKey = normalizeEmail(email);
    if (!emailKey) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const k = keys(emailKey);

    const challenge = await redisGet(k.loginChallenge);
    if (!challenge) {
      return res.status(401).json({
        success: false,
        message: 'Start over: enter your password again to request a new code.',
      });
    }

    const cooldownTtl = await redisTtl(k.loginOtpCooldown);
    if (cooldownTtl > 0) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting another code.',
        seconds_remaining: cooldownTtl,
      });
    }

    const user = await AdminUser.findOne({ email: emailKey });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const otp = generateOtp();
    await redisSet(k.loginOtp, otp, OTP_TTL_SEC);
    await redisSet(k.loginOtpCooldown, '1', OTP_RESEND_COOLDOWN_SEC);

    try {
      await sendAdminLoginOtpEmail(user.email, otp);
    } catch (mailErr) {
      console.error('adminResendLoginOtp email', mailErr);
      return res.status(502).json({
        success: false,
        message: 'Could not send email. Try again shortly.',
      });
    }

    return res.status(200).json({ success: true, message: 'A new code was sent to your email.' });
  } catch (e) {
    console.error('adminResendLoginOtp', e);
    return res.status(500).json({ success: false, message: 'Could not resend code.' });
  }
}

export async function adminForgotPassword(req, res) {
  try {
    try {
      assertOtpStack();
    } catch (cfgErr) {
      return res.status(500).json({ success: false, message: cfgErr.message });
    }

    const { email } = req.body || {};
    const emailKey = normalizeEmail(email);
    if (!emailKey) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const k = keys(emailKey);

    const cooldownTtl = await redisTtl(k.resetCooldown);
    if (cooldownTtl > 0) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting another reset code.',
        seconds_remaining: cooldownTtl,
      });
    }

    const user = await AdminUser.findOne({ email: emailKey });
    const generic = {
      success: true,
      message: 'If an account exists for that email, a reset code was sent.',
    };

    if (!user || !user.isActive) {
      await redisSet(k.resetCooldown, '1', OTP_RESEND_COOLDOWN_SEC);
      return res.status(200).json(generic);
    }

    const otp = generateOtp();
    await redisSet(k.resetOtp, otp, OTP_TTL_SEC);
    await redisSet(k.resetCooldown, '1', OTP_RESEND_COOLDOWN_SEC);

    try {
      await sendAdminPasswordResetOtpEmail(user.email, otp);
    } catch (mailErr) {
      await redisDel(k.resetOtp);
      console.error('adminForgotPassword email', mailErr);
      return res.status(502).json({
        success: false,
        message: 'Could not send email. Try again later.',
      });
    }

    return res.status(200).json(generic);
  } catch (e) {
    console.error('adminForgotPassword', e);
    return res.status(500).json({ success: false, message: 'Request failed.' });
  }
}

export async function adminVerifyResetOtp(req, res) {
  try {
    const { email, otp } = req.body || {};
    const emailKey = normalizeEmail(email);
    const code = typeof otp === 'string' ? otp.trim() : '';

    if (!emailKey || !code) {
      return res.status(400).json({ success: false, message: 'Email and code are required.' });
    }

    const k = keys(emailKey);
    const stored = await redisGet(k.resetOtp);

    if (!otpEquals(stored, code)) {
      return res.status(401).json({ success: false, message: 'Invalid or expired code.' });
    }

    await redisDel(k.resetOtp);
    await redisSet(k.resetVerified, '1', RESET_VERIFIED_TTL_SEC);

    return res.status(200).json({ success: true, verified: true });
  } catch (e) {
    console.error('adminVerifyResetOtp', e);
    return res.status(500).json({ success: false, message: 'Verification failed.' });
  }
}

export async function adminResetPassword(req, res) {
  try {
    const { email, newPassword } = req.body || {};
    const emailKey = normalizeEmail(email);

    if (!emailKey || typeof newPassword !== 'string') {
      return res.status(400).json({ success: false, message: 'Email and new password are required.' });
    }
    if (newPassword.length < MIN_PASSWORD_LEN) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LEN} characters.`,
      });
    }

    const k = keys(emailKey);
    const verified = await redisGet(k.resetVerified);
    if (!verified) {
      return res.status(401).json({
        success: false,
        message: 'Reset session expired. Request a new code and verify it first.',
      });
    }

    const user = await AdminUser.findOne({ email: emailKey });
    if (!user || !user.isActive) {
      await redisDel(k.resetVerified);
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    await redisDel(k.resetVerified);
    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    return res.status(200).json({ success: true, message: 'Password updated. You can sign in now.' });
  } catch (e) {
    console.error('adminResetPassword', e);
    return res.status(500).json({ success: false, message: 'Could not reset password.' });
  }
}

export async function adminMe(req, res) {
  const secret = jwtSecret();
  const header = req.headers.authorization;
  if (!secret || !header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(header.slice(7), secret);
    const email = typeof payload.sub === 'string' ? payload.sub : undefined;
    return res.status(200).json({ success: true, data: { role: 'admin', email } });
  } catch {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
}

export async function adminLogout(_req, res) {
  return res.status(200).json({ success: true });
}
