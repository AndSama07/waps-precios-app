import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import initialProductsData from '../data/initialProducts.json';
import { DEFAULT_COMMISSION } from '../utils/calculator';

const AppContext = createContext();

const STORAGE_KEYS = {
  PRODUCTS: 'waps_products_v1',
  COMMISSION: 'waps_commission_v1'
};

export function AppProvider({ children }) {
  // Estado de Productos con persistencia inicial
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading products from localStorage', e);
    }
    return initialProductsData;
  });

  // Estado de Tasas y Comisiones
  const [commissionSettings, setCommissionSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMMISSION);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.terms) return parsed;
      }
    } catch (e) {
      console.error('Error loading commission settings from localStorage', e);
    }
    return DEFAULT_COMMISSION;
  });

  // Estado de conexión con Neon Serverless Postgres
  const [dbStatus, setDbStatus] = useState('connecting'); // 'connecting' | 'online' | 'offline'
  const [isSyncing, setIsSyncing] = useState(false);

  // Filtros y Navegación
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'admin'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL'); // 'ALL' | 'NUEVO' | 'USADO'
  const [selectedTerm, setSelectedTerm] = useState(12); // Default to 12 months for quick installment viewing
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured'); // 'featured', 'price-asc', 'price-desc', 'name-asc'
  
  // Modal de Detalle / Cotización
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Toast / Notificaciones
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3200);
  }, []);

  // Función para sincronizar con Neon Postgres
  const syncWithNeon = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsSyncing(true);
    try {
      // 1. Obtener productos de Neon
      const resProducts = await fetch('/api/products');
      if (resProducts.ok) {
        const data = await resProducts.json();
        if (data.status === 'ok' && Array.isArray(data.data) && data.data.length > 0) {
          setProducts(data.data);
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.data));
          setDbStatus('online');
        } else if (data.status === 'offline') {
          setDbStatus('offline');
        }
      } else {
        setDbStatus('offline');
      }

      // 2. Obtener tasas de Neon
      const resRates = await fetch('/api/rates');
      if (resRates.ok) {
        const ratesData = await resRates.json();
        if (ratesData.status === 'ok' && ratesData.data?.terms) {
          setCommissionSettings(ratesData.data);
          localStorage.setItem(STORAGE_KEYS.COMMISSION, JSON.stringify(ratesData.data));
        }
      }
    } catch (err) {
      console.warn('Neon DB no disponible actualmente (usando almacenamiento local/offline):', err.message);
      setDbStatus('offline');
    } finally {
      if (!isSilent) setIsSyncing(false);
    }
  }, []);

  // Sincronizar al iniciar y luego cada 45 segundos para recibir cambios de otros dispositivos
  useEffect(() => {
    syncWithNeon(false);
    const interval = setInterval(() => {
      syncWithNeon(true);
    }, 45000);
    return () => clearInterval(interval);
  }, [syncWithNeon]);

  // Guardar en localStorage cuando cambian los productos
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Error saving products to localStorage', e);
    }
  }, [products]);

  // Guardar tasas en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMMISSION, JSON.stringify(commissionSettings));
    } catch (e) {
      console.error('Error saving commission settings to localStorage', e);
    }
  }, [commissionSettings]);

  // CRUD de productos sincronizado con Neon
  const addProduct = async (newProduct) => {
    const productWithId = {
      ...newProduct,
      id: `prod_${Date.now()}`,
      cashPrice: Number(newProduct.cashPrice) || 0,
      stock: Number(newProduct.stock) || 0,
      sourceSheet: 'MANUAL',
      variants: newProduct.variants || null
    };

    // Actualización optimista inmediata en UI
    setProducts(prev => [productWithId, ...prev]);
    showToast(`"${productWithId.name}" agregado con éxito`);

    // Sincronizar con Neon Postgres
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productWithId)
      });
    } catch (err) {
      console.error('Error enviando nuevo producto a Neon:', err);
    }

    return productWithId;
  };

  const updateProduct = async (id, fields) => {
    // Actualización optimista inmediata en UI
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, ...fields };
          if (fields.cashPrice !== undefined) updated.cashPrice = Number(fields.cashPrice) || 0;
          if (fields.stock !== undefined) updated.stock = Number(fields.stock) || 0;
          return updated;
        }
        return p;
      })
    );
    showToast('Producto actualizado correctamente');

    // Sincronizar con Neon Postgres
    try {
      await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...fields })
      });
    } catch (err) {
      console.error('Error actualizando producto en Neon:', err);
    }
  };

  const deleteProduct = async (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    if (selectedProduct?.id === id) setSelectedProduct(null);
    showToast('Producto eliminado del catálogo', 'info');

    try {
      await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Error eliminando producto en Neon:', err);
    }
  };

  const updateCommissionSettings = async (newSettings) => {
    setCommissionSettings(newSettings);
    showToast('Tasas de financiamiento actualizadas');

    try {
      await fetch('/api/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
    } catch (err) {
      console.error('Error actualizando tasas en Neon:', err);
    }
  };

  const resetToDefaults = async () => {
    setProducts(initialProductsData);
    setCommissionSettings(DEFAULT_COMMISSION);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.COMMISSION);
    showToast('Catálogo y tasas restablecidos a los originales de Google Drive', 'info');

    try {
      await fetch('/api/seed', { method: 'POST' });
    } catch (err) {
      console.error('Error restableciendo seed en Neon:', err);
    }
  };

  const importProducts = async (newProducts, mode = 'merge') => {
    if (mode === 'replace') {
      setProducts(newProducts);
      showToast(`Catálogo reemplazado con ${newProducts.length} productos`);
    } else {
      setProducts(prev => {
        const existingCodes = new Set(prev.map(p => p.code).filter(Boolean));
        const added = newProducts.filter(p => !p.code || !existingCodes.has(p.code));
        return [...prev, ...added];
      });
      showToast(`Importación completada. Se añadieron productos nuevos.`);
    }

    // Enviar lote a Neon
    try {
      for (const p of newProducts) {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p)
        });
      }
    } catch (err) {
      console.error('Error importando a Neon:', err);
    }
  };

  // Categorías y Marcas únicas
  const categories = ['ALL', ...new Set(products.map(p => p.category).filter(Boolean))];
  const brands = ['ALL', ...new Set(products.map(p => p.brand).filter(Boolean))];

  // Productos filtrados para el cotizador
  const filteredProducts = products.filter(p => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(term);
      const matchBrand = (p.brand || '').toLowerCase().includes(term);
      const matchCat = (p.category || '').toLowerCase().includes(term);
      const matchCode = (p.code || '').toLowerCase().includes(term);
      if (!matchName && !matchBrand && !matchCat && !matchCode) return false;
    }

    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
      return false;
    }

    if (selectedBrand !== 'ALL' && p.brand !== selectedBrand) {
      return false;
    }

    if (selectedCondition !== 'ALL') {
      const isUsed = p.condition === 'USADO' || (p.name && p.name.includes('(USADO)'));
      if (selectedCondition === 'USADO' && !isUsed) return false;
      if (selectedCondition === 'NUEVO' && isUsed) return false;
    }

    if (inStockOnly && p.stock <= 0) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.cashPrice - b.cashPrice;
    if (sortBy === 'price-desc') return b.cashPrice - a.cashPrice;
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'stock-desc') return b.stock - a.stock;
    return 0;
  });

  return (
    <AppContext.Provider
      value={{
        products,
        filteredProducts,
        commissionSettings,
        categories,
        brands,
        activeTab,
        setActiveTab,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        selectedBrand,
        setSelectedBrand,
        selectedCondition,
        setSelectedCondition,
        selectedTerm,
        setSelectedTerm,
        inStockOnly,
        setInStockOnly,
        sortBy,
        setSortBy,
        selectedProduct,
        setSelectedProduct,
        toast,
        showToast,
        dbStatus,
        isSyncing,
        syncWithNeon,
        addProduct,
        updateProduct,
        deleteProduct,
        updateCommissionSettings,
        resetToDefaults,
        importProducts
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
