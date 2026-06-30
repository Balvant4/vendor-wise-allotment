const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { connectDB } = require('./../../database/connection');
const mongoose = require('mongoose');

async function seed() {
  await connectDB();

  const UserModule = require('./../../models/User');
  const User = UserModule.default;

  const existing = await User.findOne({ email: 'admin@logistics.com' });
  if (existing) {
    console.log('[Seed] Admin already exists — skipping');
    process.exit(0);
  }

  await User.create({
    name:     'Super Admin',
    email:    'admin@logistics.com',
    password: 'Admin@1234',
    role:     'admin',
    isActive: true,
  });

  console.log('[Seed] ✅ Admin created: admin@logistics.com / Admin@1234');
  process.exit(0);
}

seed().catch((err) => { console.error('[Seed] Failed:', err); process.exit(1); });