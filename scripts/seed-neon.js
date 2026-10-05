import fs from 'fs';
import { neon } from '@neondatabase/serverless';
import initialProducts from '../src/data/initialProducts.json' with { type: 'json' };

// Cargar .env.local manualmente
if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let val = match[2] || '';
      val = val.trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  });
}

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not found');

  const sql = neon(url);
  console.log('Connecting to Neon...');

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT,
      category TEXT,
      condition TEXT DEFAULT 'NUEVO',
      cash_price NUMERIC NOT NULL,
      stock INTEGER DEFAULT 0,
      code TEXT,
      source_sheet TEXT,
      variants JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  try {
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'NUEVO';`;
  } catch (e) {
    console.warn(e.message);
  }

  await sql`TRUNCATE TABLE products;`;
  console.log(`Inserting ${initialProducts.length} separated products into Neon...`);

  for (const p of initialProducts) {
    await sql`
      INSERT INTO products (
        id, name, brand, category, condition, cash_price, stock, code, source_sheet, variants
      ) VALUES (
        ${p.id},
        ${p.name},
        ${p.brand || ''},
        ${p.category || ''},
        ${p.condition || 'NUEVO'},
        ${Number(p.cashPrice) || 0},
        ${Number(p.stock) || 0},
        ${p.code || ''},
        ${p.sourceSheet || 'MANUAL'},
        ${p.variants ? JSON.stringify(p.variants) : null}
      );
    `;
  }

  const count = await sql`SELECT count(*), count(*) FILTER (WHERE condition = 'USADO') as usados, count(*) FILTER (WHERE condition = 'NUEVO') as nuevos FROM products;`;
  console.log('Neon database successfully updated!', count[0]);
}

run().catch(console.error);
