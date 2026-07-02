const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { connectDB } = require('./../../database/connection');
const mongoose = require('mongoose');

// Reads the initial admin's credentials from env vars instead of hardcoding
// a well-known password. Set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD before
// running this script; if SEED_ADMIN_PASSWORD is omitted, a random one is
// generated and printed once — copy it immediately, it isn't stored anywhere.
async function seed() {
  await connectDB();

  const UserModule = require('./../../models/User');
  const User = UserModule.default;

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@logistics.com';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('[Seed] Admin already exists — skipping');
    process.exit(0);
  }

  const password = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');

  await User.create({
    name:     'Super Admin',
    email,
    password,
    role:     'admin',
    isActive: true,
  });

  console.log('[Seed] ✅ Admin created.');
  console.log(`[Seed]    Email:    ${email}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(`[Seed]    Password: ${password}`);
    console.log('[Seed]    ⚠ This password is only shown once — save it now, then log in and change it.');
  } else {
    console.log('[Seed]    Password: (from SEED_ADMIN_PASSWORD env var)');
  }
  process.exit(0);
}

seed().catch((err) => { console.error('[Seed] Failed:', err); process.exit(1); });