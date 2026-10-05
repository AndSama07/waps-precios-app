import { getDb, initDb } from './db.js';
import { DEFAULT_COMMISSION } from '../src/utils/calculator.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const sql = getDb();
  if (!sql) {
    return res.status(200).json({
      status: 'offline',
      message: 'DATABASE_URL no configurada',
      data: DEFAULT_COMMISSION
    });
  }

  try {
    await initDb(sql);

    // GET: Obtener tasas
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT value FROM app_settings WHERE key = 'commission' LIMIT 1;
      `;

      if (rows && rows.length > 0) {
        return res.status(200).json({
          status: 'ok',
          source: 'neon',
          data: rows[0].value
        });
      }

      // Si no existe, guardar el default
      await sql`
        INSERT INTO app_settings (key, value)
        VALUES ('commission', ${JSON.stringify(DEFAULT_COMMISSION)})
        ON CONFLICT (key) DO NOTHING;
      `;

      return res.status(200).json({
        status: 'ok',
        source: 'default',
        data: DEFAULT_COMMISSION
      });
    }

    // POST / PUT: Actualizar tasas
    if (req.method === 'POST' || req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const settings = body.settings || body;

      await sql`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES ('commission', ${JSON.stringify(settings)}, NOW())
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          updated_at = NOW();
      `;

      return res.status(200).json({
        status: 'ok',
        message: 'Tasas guardadas en Neon Postgres',
        data: settings
      });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('Error en API /api/rates:', err);
    return res.status(500).json({ status: 'error', error: err.message });
  }
}
