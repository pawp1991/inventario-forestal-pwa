# Inventario Forestal PWA - v3.2

## 🎉 NUEVA FUNCIONALIDAD: Exportación a Excel (XLSX)

La versión 3.2 agrega soporte para exportar datos directamente a formato Excel (.xlsx), además del formato CSV existente.

---

## 📊 Formatos de Exportación Disponibles

### ✅ CSV (valores separados por comas)
- Compatible con Excel, Google Sheets, R, Python
- Formato ligero y universal
- Ideal para análisis estadístico

### ✅ XLSX (Excel nativo)
- Formato nativo de Microsoft Excel
- Mejor compatibilidad con Excel
- Mantiene formato de celdas
- Columnas con ancho automático

---

## 🔧 Funcionalidades de Exportación

### 1. **Exportar Lote Individual**
- Botón: "Exportar Lote"
- Exporta datos del lote actual
- Opción de elegir formato (CSV o XLSX)

### 2. **Exportación Masiva**
- Botón: "Exportar Todo" (header superior)
- Muestra sección con estadísticas globales
- Dos botones separados:
  - **"Exportar CSV"** → Genera archivo .csv
  - **"Exportar XLSX"** → Genera archivo .xlsx

### 3. **Exportar Estadísticas**
- Genera resumen por parcela
- Incluye: Total árboles, DAP promedio, Densidad/ha
- Formato: CSV

---

## 📦 Estructura de Archivos Exportados

Ambos formatos (CSV y XLSX) contienen la misma información:

```
Lote | Parcela | Fecha_Medicion | Numero_Arbol | DAP_cm | CAP_cm | Total_Arboles | DAP_Promedio | Densidad_ha
```

### Opciones configurables:
- ✅ Incluir estadísticas por parcela
- ✅ Incluir fecha de exportación en nombre del archivo

---

## 🚀 Cómo Actualizar a v3.2

### Opción A: Actualización Automática (Recomendado)
1. **Exporta tus datos actuales** (por seguridad)
2. **Sube los nuevos archivos** a GitHub Pages:
   - `index.html`
   - `script.js`
   - `manifest.json`
   - `sw.js`
3. **Espera 3-5 minutos** para propagación
4. **Abre la app en tu móvil**
5. La app se actualizará automáticamente

### Opción B: Actualización Manual
1. **Cierra completamente** la app
2. **Abre en navegador** tu URL de GitHub Pages
3. **Verifica** que muestre "v3.2" en el header
4. **Reinstala** la PWA desde el navegador
5. **Tus datos se mantendrán** (localStorage)

---

## 📱 Uso de la Nueva Funcionalidad

### Exportar un Lote:
1. Selecciona tu lote activo
2. Click en "Exportar Lote"
3. Elige formato:
   - **Aceptar** = XLSX
   - **Cancelar** = CSV

### Exportación Masiva:
1. Click en "Exportar Todo" (header)
2. Aparece sección azul con estadísticas
3. Configura opciones (checkboxes)
4. Click en:
   - **"Exportar CSV"** para archivo .csv
   - **"Exportar XLSX"** para archivo .xlsx

---

## 🔍 Ventajas del Formato XLSX

### ✅ Mejor para Excel:
- Se abre directamente sin conversión
- Formato de celdas preservado
- Columnas con ancho ajustado

### ✅ Mejor presentación:
- Encabezados formateados
- Números como valores (no texto)
- Mejor para reportes profesionales

### 📊 Cuándo usar cada formato:

**USA CSV si:**
- Vas a analizar en R o Python
- Necesitas formato ligero
- Vas a importar a bases de datos

**USA XLSX si:**
- Vas a trabajar en Excel
- Necesitas formato profesional
- Vas a compartir con no-técnicos
- Quieres mejor presentación visual

---

## 🛠️ Requisitos Técnicos

### Librería agregada:
- **SheetJS (xlsx.js)** v0.20.1
- Cargada desde CDN
- Sin dependencias adicionales

### Compatibilidad:
- ✅ Chrome/Edge (móvil y desktop)
- ✅ Safari (iOS y macOS)
- ✅ Firefox
- ✅ Samsung Internet

---

## 📋 Checklist de Actualización

- [ ] Exportar datos actuales (backup)
- [ ] Subir nuevos archivos a GitHub Pages
- [ ] Esperar 3-5 minutos
- [ ] Verificar versión en navegador
- [ ] Probar exportación CSV
- [ ] Probar exportación XLSX
- [ ] Verificar archivos descargados

---

## ⚠️ Notas Importantes

1. **Los datos existentes se mantienen** durante la actualización
2. **Las exportaciones se descargan** al dispositivo
3. **Ambos formatos** contienen los mismos datos
4. **Los archivos XLSX** son ligeramente más pesados que CSV
5. **La librería SheetJS** se carga desde CDN (requiere internet la primera vez)

---

## 🎯 Próximas Mejoras Sugeridas

- [ ] Exportación con múltiples hojas (una por lote)
- [ ] Gráficos integrados en XLSX
- [ ] Formato con colores y estilos
- [ ] Importación desde XLSX
- [ ] Plantillas personalizadas

---

## 📞 Soporte

Si tienes problemas con la actualización:
1. Exporta tus datos
2. Borra la app instalada
3. Limpia cache del navegador
4. Reinstala desde GitHub Pages
5. Importa tus datos (si es necesario)

---

**Versión:** 3.2.0  
**Fecha:** Noviembre 2025  
**Cambios:** Agregada exportación XLSX con SheetJS
