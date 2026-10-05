import { getDb, initDb } from './db.js';
import initialProducts from '../src/data/initialProducts.json' with { type: 'json' };

export default async function handler(req, res) {
  // Configurar CORS para permitir peticiones desde cualquier origen / dispositivo
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
      message: 'DATABASE_URL no configurada en las variables de entorno de Vercel.',
      data: initialProducts
    });
  }

  try {
    await initDb(sql);

    // GET: Obtener lista de productos
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT 
          id,
          name,
          brand,
          category,
          cash_price as "cashPrice",
          stock,
          code,
          source_sheet as "sourceSheet",
          variants,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM products
        ORDER BY created_at ASC;
      `;

      // Si la base de datos está vacía, sembramos automáticamente los 393 productos iniciales
      if (!rows || rows.length === 0) {
        console.log('Sembrando 393 productos iniciales en Neon Postgres...');
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
            ON CONFLICT (id) DO NOTHING;
          `;
        }

        const seededRows = await sql`
          SELECT 
            id,
            name,
            brand,
            category,
            cash_price as "cashPrice",
            stock,
            code,
            source_sheet as "sourceSheet",
            variants
          FROM products
          ORDER BY created_at ASC;
        `;

        return res.status(200).json({
          status: 'ok',
          source: 'neon',
          seeded: true,
          data: seededRows.map(r => ({
            ...r,
            cashPrice: Number(r.cashPrice),
            stock: Number(r.stock)
          }))
        });
      }

      return res.status(200).json({
        status: 'ok',
        source: 'neon',
        data: rows.map(r => ({
          ...r,
          cashPrice: Number(r.cashPrice),
          stock: Number(r.stock)
        }))
      });
    }

    // POST: Agregar nuevo producto
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, name, brand, category, cashPrice, stock, code, sourceSheet, variants } = body;
      const prodId = id || `prod_${Date.now()}`;

      await sql`
        INSERT INTO products (
          id, name, brand, category, cash_price, stock, code, source_sheet, variants, updated_at
        ) VALUES (
          ${prodId},
          ${name},
          ${brand || ''},
          ${category || ''},
          ${Number(cashPrice) || 0},
          ${Number(stock) || 0},
          ${code || ''},
          ${sourceSheet || 'MANUAL'},
          ${variants ? JSON.stringify(variants) : null},
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          brand = EXCLUDED.brand,
          category = EXCLUDED.category,
          cash_price = EXCLUDED.cash_price,
          stock = EXCLUDED.stock,
          code = EXCLUDED.code,
          variants = EXCLUDED.variants,
          updated_at = NOW();
      `;

      return res.status(200).json({
        status: 'ok',
        message: 'Producto guardado en Neon',
        data: {
          id: prodId,
          name,
          brand,
          category,
          cashPrice: Number(cashPrice) || 0,
          stock: Number(stock) || 0,
          code,
          sourceSheet: sourceSheet || 'MANUAL',
          variants
        }
      });
    }

    // PUT: Actualizar precio, stock o campos de un producto
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, name, brand, category, cashPrice, stock, code, variants } = body;

      if (!id) {
        return res.status(400).json({ error: 'ID de producto requerido' });
      }

      await sql`
        UPDATE products SET
          name = COALESCE(${name}, name),
          brand = COALESCE(${brand}, brand),
          category = COALESCE(${category}, category),
          cash_price = COALESCE(${cashPrice !== undefined ? Number(cashPrice) : null}, cash_price),
          stock = COALESCE(${stock !== undefined ? Number(stock) : null}, stock),
          code = COALESCE(${code}, code),
          variants = COALESCE(${variants ? JSON.stringify(variants) : null}, variants),
          updated_at = NOW()
        WHERE id = ${id};
      `;

      return res.status(200).json({
        status: 'ok',
        message: 'Producto actualizado en Neon'
      });
    }

    // DELETE: Eliminar producto
    if (req.method === 'DELETE') {
      const { id } = req.query || (typeof req.body === 'string' ? JSON.parse(req.body) : req.body);
      if (!id) {
        return res.status(400).json({ error: 'ID de producto requerido' });
      }

      await sql`DELETE FROM products WHERE id = ${id};`;
      return res.status(200).json({ status: 'ok', message: 'Producto eliminado en Neon' });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('Error en API /api/products:', err);
    return res.status(500).json({ status: 'error', error: err.message });
  }
}
