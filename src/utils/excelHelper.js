import * as XLSX from 'xlsx';

/**
 * Exporta el catálogo actual a un archivo Excel (.xlsx)
 */
export function exportCatalogToExcel(products, filename = 'WAPS_PRECIOS_ACTUALIZADOS.xlsx') {
  const exportData = products.map(p => ({
    'ID': p.id,
    'CODIGO / SKU': p.code || '',
    'PRODUCTO': p.name,
    'CONDICION': p.condition || (p.name.includes('(USADO)') ? 'USADO' : 'NUEVO'),
    'MARCA': p.brand || '',
    'CATEGORIA': p.category || '',
    'PRECIO EFECTIVO': p.cashPrice,
    'STOCK / CANTIDAD': p.stock,
    'ORIGEN': p.sourceSheet || 'MANUAL'
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

  // Guardar archivo
  XLSX.writeFile(workbook, filename);
}

/**
 * Parsea un archivo Excel o CSV subido por el usuario
 */
export function parseUploadedExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Intentar leer la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length < 2) {
          throw new Error('El archivo está vacío o no contiene suficientes filas.');
        }

        const headers = rawRows[0].map(h => (h || '').toString().trim().toUpperCase());
        
        // Mapeo inteligente de columnas
        const nameIdx = headers.findIndex(h => h.includes('PROD') || h.includes('NOM') || h.includes('DESCRIP') || h.includes('MODEL'));
        const priceIdx = headers.findIndex(h => h.includes('PRECIO') || h.includes('EFECTIVO') || h.includes('CASH') || h.includes('WAPS'));
        const stockIdx = headers.findIndex(h => h.includes('STOCK') || h.includes('CANT') || h.includes('DISP'));
        const brandIdx = headers.findIndex(h => h.includes('MARCA') || h.includes('BRAND'));
        const catIdx = headers.findIndex(h => h.includes('CAT') || h.includes('TIPO'));
        const codeIdx = headers.findIndex(h => h.includes('SKU') || h.includes('COD') || h.includes('ID') || h.includes('MNP'));

        const parsedProducts = [];
        let idCounter = Date.now();

        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          const name = nameIdx !== -1 ? (row[nameIdx] || '').toString().trim() : (row[0] || '').toString().trim();
          if (!name) continue;

          let cashPrice = 0;
          if (priceIdx !== -1) {
            cashPrice = parseFloat(row[priceIdx]) || 0;
          } else {
            // Buscar la primera columna numérica
            for (let c = 1; c < row.length; c++) {
              const val = parseFloat(row[c]);
              if (!isNaN(val) && val > 0) {
                cashPrice = val;
                break;
              }
            }
          }

          const stock = stockIdx !== -1 ? (parseInt(row[stockIdx], 10) || 0) : 5;
          const brand = brandIdx !== -1 && row[brandIdx] ? row[brandIdx].toString().trim() : 'General';
          const category = catIdx !== -1 && row[catIdx] ? row[catIdx].toString().trim() : 'General';
          const code = codeIdx !== -1 && row[codeIdx] ? row[codeIdx].toString().trim() : '';

          parsedProducts.push({
            id: `imported_${idCounter++}_${i}`,
            name,
            cashPrice: Math.round(cashPrice * 100) / 100,
            stock,
            brand,
            category,
            code,
            sourceSheet: 'IMPORTADO',
            variants: null
          });
        }

        resolve({
          sheetNames: workbook.SheetNames,
          products: parsedProducts,
          total: parsedProducts.length
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
