import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';
import AdminUser from '../models/AdminUser.js';
import { sendAdminWelcomeEmail } from '../services/adminEmail.js';

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LEN = 8;
const GENERATED_PASSWORD_LEN = 18;

const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*-';

function generateStrongPassword() {
  const bytes = randomBytes(GENERATED_PASSWORD_LEN);
  let s = '';
  for (let i = 0; i < GENERATED_PASSWORD_LEN; i += 1) {
    s += CHARSET[bytes[i] % CHARSET.length];
  }
  return s;
}

function normalizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

function loginUrlHint() {
  const dash = process.env.DASHBOARD_LOGIN_URL?.trim();
  if (dash) return dash;
  const front = process.env.FRONTEND_URL?.trim()?.replace(/\/$/, '');
  if (front) return `${front}/admin/login`;
  return 'your Grovyn admin login URL';
}

export async function adminListUsers(_req, res) {
  try {
    const users = await AdminUser.find({})
      .select('email isActive createdAt updatedAt')
      .sort({ createdAt: 1 })
      .lean();

    const data = users.map((u) => ({
      id: String(u._id),
      email: u.email,
      isActive: u.isActive,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return res.status(200).json({ success: true, data });
  } catch (e) {
    console.error('adminListUsers', e);
    return res.status(500).json({ success: false, message: 'Could not list users.' });
  }
}

/**
 * Body: { email, password?: string, generatePassword?: boolean }
 * Sends initial password to the new user's email (never returned in JSON when generated).
 */
export async function adminCreateUser(req, res) {
  try {
    const { email, password: rawPassword, generatePassword } = req.body || {};
    const emailKey = normalizeEmail(email);

    if (!emailKey) {
      return res.status(400).json({ success: false, message: 'A valid email is required.' });
    }

    let plainPassword;
    if (generatePassword === true) {
      plainPassword = generateStrongPassword();
    } else {
      if (typeof rawPassword !== 'string' || rawPassword.length < MIN_PASSWORD_LEN) {
        return res.status(400).json({
          success: false,
          message: `Password must be at least ${MIN_PASSWORD_LEN} characters, or enable generate password.`,
        });
      }
      plainPassword = rawPassword;
    }

    const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

    let user;
    try {
      user = await AdminUser.create({
        email: emailKey,
        passwordHash,
        isActive: true,
      });
    } catch (e) {
      if (e.code === 11000) {
        return res.status(409).json({ success: false, message: 'An admin with this email already exists.' });
      }
      throw e;
    }

    try {
      await sendAdminWelcomeEmail(user.email, plainPassword, loginUrlHint());
    } catch (mailErr) {
      await AdminUser.deleteOne({ _id: user._id });
      console.error('adminCreateUser email', mailErr);
      return res.status(502).json({
        success: false,
        message: 'User was not created: could not send welcome email. Check Resend / EMAIL_FROM.',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Admin invited. Sign-in instructions were sent by email.',
      data: {
        id: String(user._id),
        email: user.email,
        passwordGenerated: generatePassword === true,
      },
    });
  } catch (e) {
    console.error('adminCreateUser', e);
    return res.status(500).json({ success: false, message: 'Could not create user.' });
  }
}

export async function adminDeleteUser(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'User id is required.' });
    }

    const actorEmail = req.adminEmail ? normalizeEmail(req.adminEmail) : '';

    const target = await AdminUser.findById(id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (actorEmail && normalizeEmail(target.email) === actorEmail) {
      return res.status(400).json({ success: false, message: 'You cannot remove your own account.' });
    }

    const total = await AdminUser.countDocuments();
    if (total <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the last admin account.',
      });
    }

    await AdminUser.deleteOne({ _id: target._id });

    return res.status(200).json({ success: true, message: 'Admin removed.' });
  } catch (e) {
    console.error('adminDeleteUser', e);
    return res.status(500).json({ success: false, message: 'Could not remove user.' });
  }
}
