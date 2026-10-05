import { getDb, initDb } from './db.js';
import initialProducts from '../src/data/initialProducts.json' with { type: 'json' };
import { DEFAULT_COMMISSION } from '../src/utils/calculator.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET');

  const sql = getDb();
  if (!sql) {
    return res.status(500).json({ error: 'DATABASE_URL no configurada' });
  }

  try {
    await initDb(sql);

    // Limpiar tabla de productos
    await sql`TRUNCATE TABLE products;`;

    // Insertar los 393 productos
    for (const p of initialProducts) {
      await sql`
        INSERT INTO products (
          id, name, brand, category, cash_price, stock, code, source_sheet, variants
        ) VALUES (
          ${p.id},
          ${p.name},
          ${p.brand || ''},
          ${p.category || ''},
          ${Number(p.cashPrice) || 0},
          ${Number(p.stock) || 0},
          ${p.code || ''},
          ${p.sourceSheet || 'MANUAL'},
          ${p.variants ? JSON.stringify(p.variants) : null}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          cash_price = EXCLUDED.cash_price,
          stock = EXCLUDED.stock;
      `;
    }

    // Restablecer tasas
    await sql`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES ('commission', ${JSON.stringify(DEFAULT_COMMISSION)}, NOW())
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = NOW();
    `;

    return res.status(200).json({
      status: 'ok',
      message: `Base de datos Neon sembrada exitosamente con ${initialProducts.length} productos y tasas originales de Google Drive.`
    });
  } catch (err) {
    console.error('Error en seed:', err);
    return res.status(500).json({ error: err.message });
  }
}
