# 📱 WAPS Store - Cotizador & Gestor de Precios

Aplicación web multiplataforma (PWA para Android, iPhone, iPad y PC) para la consulta ultrarrápida de precios, cálculo de comisiones a crédito (3 a 36 meses), y panel de administración sincronizado en tiempo real con **Neon Serverless Postgres** y desplegable en **Vercel**.

---

## 🚀 Características Principales

1. **Cotizador Ultrarrápido de Ventas:**
   * Búsqueda en tiempo real por modelo, marca, categoría o código SKU.
   * Filtro rápido de cuotas en tarjetas (Efectivo, 3M, 6M, 9M, 12M, 18M, 24M, 36M).
   * **Métodos de 1 solo pago:**
     * **Efectivo / Transferencia:** Precio base de lista (**0% recargo**).
     * **Tarjeta (1 solo pago):** Recargo base del **6.0%** ($$Precio \times 1.06$$).
   * **Planes de Cuotas con Tarjeta:**
     * Fórmula oficial de `CUADRO COMISION.xlsx`:
       $$\text{Total Financiado} = \text{Efectivo} \times (1 + \text{Comisión Base (6%)} + \text{Margen Plazo})$$
       $$\text{Cuota Mensual} = \frac{\text{Total Financiado}}{\text{Meses}}$$
   * **Selección individual o múltiple de cuotas:**
     * Puedes seleccionar exactamente la cuota o las cuotas que deseas cotizar (ej. solo 12 meses, o 12 y 24 meses).
     * El mensaje generado para WhatsApp solo incluye los plazos seleccionados.
   * **Simulador de prima / anticipo en efectivo:**
     * Deduce la prima y calcula las cuotas sobre el saldo restante a financiar con tarjeta.

2. **Panel de Administrador:**
   * Edición en línea rápida de precios y stock.
   * Creación de nuevos modelos y eliminación de productos.
   * Modificación de la tasa base (6%) y los márgenes de financiamiento por plazo.
   * Importación y exportación de listas completas a Excel (`.xlsx`).

3. **Base de Datos en la Nube con Neon Serverless Postgres:**
   * Sincronización en tiempo real entre todos los dispositivos (celulares, tablets y computadoras).
   * Cuando se modifica un precio o stock en el panel de administrador, se actualiza automáticamente en todos los dispositivos conectados.

---

## 🛠️ Despliegue en Vercel & Conexión con Neon

### Paso 1: Conectar en Vercel
1. Ingresa a [Vercel](https://vercel.com) e inicia sesión con tu cuenta de GitHub (`AndSama07`).
2. Haz clic en **"Add New..."** -> **"Project"**.
3. Selecciona el repositorio **`waps-precios-app`**.
4. Framework Preset: **Vite** (detectado automáticamente).

### Paso 2: Configurar Base de Datos Neon
1. Crea una base de datos gratuita en [Neon Console](https://console.neon.tech).
2. Copia la cadena de conexión de Neon (`Connection string` que empieza con `postgresql://...`).
3. En Vercel, en la sección **Environment Variables**:
   * **Key:** `DATABASE_URL`
   * **Value:** *(Pega tu Connection string de Neon con `?sslmode=require`)*
4. Haz clic en **Deploy**.

¡Listo! En el primer acceso a la app, el sistema creará automáticamente las tablas y sembrará los 393 productos iniciales del catálogo.

---

## 📲 Instalación como App en iPhone y Android (PWA)

* **En iPhone / iPad (Safari):**
  1. Abre el enlace de Vercel en Safari.
  2. Toca el botón **Compartir** (cuadrado con flecha hacia arriba).
  3. Selecciona **"Agregar a pantalla de inicio"** (*Add to Home Screen*).

* **En Android (Chrome):**
  1. Abre el enlace de Vercel en Chrome.
  2. Toca los tres puntos arriba a la derecha.
  3. Selecciona **"Instalar aplicación"** o **"Agregar a la pantalla principal"**.
