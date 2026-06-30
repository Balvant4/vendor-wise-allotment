const dotenv = require('dotenv');
const path   = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const mongoose = require('mongoose');

async function seed() {
  const { default: connectDB }          = require('./../../database/connection');
  const { default: TransporterMaster }  = require('./../../models/TransporterMaster');

  await connectDB();

  const mappings = [
    // ── FIX transporters ──────────────────────────────
    { originalName: 'B R LOGIST',  standardName: 'BR LOGISTICS',           isFix: true  },
    { originalName: 'B.R. LOGIS',  standardName: 'BR LOGISTICS',           isFix: true  },
    { originalName: 'BLR',         standardName: 'BR LOGISTICS',           isFix: true  },
    { originalName: 'BLR LOGICT',  standardName: 'BR LOGISTICS',           isFix: true  },
    { originalName: 'BLR LOGIST',  standardName: 'BR LOGISTICS',           isFix: true  },
    { originalName: 'M K TRANSP',  standardName: 'MK LOGISTICS',           isFix: true  },
    { originalName: 'M.K TRANSP',  standardName: 'MK LOGISTICS',           isFix: true  },
    { originalName: 'M.K.TRANSP',  standardName: 'MK LOGISTICS',           isFix: true  },
    { originalName: 'NEW AGE LO',  standardName: 'NEW AGE LOGISTICS',      isFix: true  },

    // ── NON FIX transporters ──────────────────────────
    { originalName: 'PRATHAM',     standardName: 'PRATHAM LOGISTICS',      isFix: false },
    { originalName: 'PRATHAM  T',  standardName: 'PRATHAM LOGISTICS',      isFix: false },
    { originalName: 'PRATHAM TA',  standardName: 'PRATHAM LOGISTICS',      isFix: false },
    { originalName: 'PRATHAM TR',  standardName: 'PRATHAM LOGISTICS',      isFix: false },
    { originalName: 'SAI KRUPA',   standardName: 'SAI KRUPA LOGISTICS',    isFix: false },
    { originalName: 'SAIKRUAP F',  standardName: 'SAI KRUPA LOGISTICS',    isFix: false },
    { originalName: 'SAIKRUPA /',  standardName: 'SAI KRUPA LOGISTICS',    isFix: false },
    { originalName: 'SAIKRUPA F',  standardName: 'SAI KRUPA LOGISTICS',    isFix: false },
    { originalName: 'SAIKRUPAFR',  standardName: 'SAI KRUPA LOGISTICS',    isFix: false },
    { originalName: 'CREATIVE L',  standardName: 'CREATIVE LOGISTICS',     isFix: false },
    { originalName: 'HIND  CARR',  standardName: 'HIND LOGISTICS',         isFix: false },
    { originalName: 'HIND CARRI',  standardName: 'HIND LOGISTICS',         isFix: false },
    { originalName: 'HIND CARRR',  standardName: 'HIND LOGISTICS',         isFix: false },
    { originalName: 'KASHTBHANJ',  standardName: 'KASHTBHANJ LOGISTICS',   isFix: false },
    { originalName: 'SAMVEDA LO',  standardName: 'SAMVEDA LOGISTICS',      isFix: false },
    { originalName: 'SAVY INFRA',  standardName: 'SAVY INFRA LOGISTICS',   isFix: false },
    { originalName: 'SHIVAY LOG',  standardName: 'SHIVAY LOGISTICS',       isFix: false },
    { originalName: 'SHRI DURGA',  standardName: 'SHRI DURGA LOGISTICS',   isFix: false },
    { originalName: 'VINAYAK BU',  standardName: 'VINAYAK LOGISTICS',      isFix: false },
    { originalName: 'RAM STAR L',  standardName: 'RAM STAR LOGISTICS',     isFix: false },
    { originalName: 'SHREE RAMA',  standardName: 'SHREE RAMA LOGISTICS',   isFix: false },
    { originalName: 'WELCO LOGI',  standardName: 'WELECO LOGISTICS',       isFix: false },
    { originalName: 'WELECO LOG',  standardName: 'WELECO LOGISTICS',       isFix: false },
    { originalName: 'WELEGO LOG',  standardName: 'WELECO LOGISTICS',       isFix: false },
    { originalName: 'SHREE SHYA',  standardName: 'SHREE SHYA LOGISTICS',   isFix: false },
  ];

  let inserted = 0;
  let skipped  = 0;

  for (const m of mappings) {
    const exists = await TransporterMaster.findOne({ originalName: m.originalName });
    if (exists) {
      skipped++;
      continue;
    }
    await TransporterMaster.create(m);
    inserted++;
  }

  console.log(`[Seed] ✅ Transporter Master seeded — ${inserted} inserted, ${skipped} already existed`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});