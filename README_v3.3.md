# Inventario Forestal PWA - v3.3

## 🎯 NUEVA FUNCIONALIDAD: Numeración Manual de Árboles

La versión 3.3 agrega **numeración manual de árboles**, permitiendo mediciones no consecutivas y reflejando la realidad del campo donde no todos los árboles se miden.

---

## 🔄 ¿Qué Cambió en v3.3?

### ✅ Antes (v3.2):
- Los árboles se numeraban automáticamente (1, 2, 3, 4...)
- No se podían omitir números
- Difícil reflejar árboles faltantes o muertos

### ✅ Ahora (v3.3):
- **Ingreso manual del número de árbol**
- **Permite números no consecutivos** (Ej: 3, 10, 15, 25)
- **Refleja la realidad del campo**
- **Validación de duplicados** con opción de reemplazar

---

## 📋 Caso de Uso Real

### Ejemplo Práctico:
**Lote:** Norte  
**Parcela:** 5  
**Árboles en campo:** Tienen marcas del 1 al 30

**Mediciones reales:**
- Árbol 3 → DAP 25.5 cm ✅
- Árbol 10 → DAP 30.2 cm ✅
- Árbol 15 → DAP 28.7 cm ✅
- Árbol 25 → DAP 32.1 cm ✅

**Árboles no medidos:**
- Árboles 1, 2: Muertos
- Árbol 5: Muy pequeño (no medible)
- Árboles 20, 22: Fuera de parcela

---

## 🚀 Cómo Usar la Nueva Funcionalidad

### Proceso de Medición:

1. **Seleccionar Lote y Parcela** (igual que antes)

2. **Ingresar Número de Árbol** 🆕
   - Campo nuevo: "Número de Árbol"
   - Ingresa el número marcado en el árbol
   - Presiona Enter → pasa a DAP

3. **Ingresar DAP**
   - Ingresa el DAP medido
   - Presiona Enter → guarda y vuelve a Número de Árbol

4. **Repetir para cada árbol**
   - Los números NO tienen que ser consecutivos
   - Puedes medir en cualquier orden (25, luego 3, luego 15...)

### Características Especiales:

#### ✅ Validación de Duplicados:
Si intentas medir el mismo árbol dos veces:
```
⚠️ El árbol 15 ya fue medido con DAP 28.7 cm.

¿Desea reemplazar la medición anterior?
```
- **Aceptar** → Actualiza la medición
- **Cancelar** → Mantiene la anterior

#### ✅ Orden Automático en Listado:
Las mediciones se muestran ordenadas por número de árbol (3, 10, 15, 25...) aunque las hayas ingresado en otro orden.

#### ✅ Flujo de Teclado Optimizado:
```
Número de Árbol → Enter → DAP → Enter → (vuelve a Número de Árbol)
```

---

## 📊 Exportación de Datos

Los archivos CSV y XLSX exportados incluyen el número de árbol real:

```csv
Lote,Parcela,Fecha_Medicion,Numero_Arbol,DAP_cm,CAP_cm,Total_Arboles,DAP_Promedio,Densidad_ha
Norte,5,2025-11-06,3,25.5,80.1,4,29.1,80
Norte,5,2025-11-06,10,30.2,94.9,4,29.1,80
Norte,5,2025-11-06,15,28.7,90.2,4,29.1,80
Norte,5,2025-11-06,25,32.1,100.8,4,29.1,80
```

**Nota:** El total de árboles (4) refleja los árboles medidos, no el número más alto (25).

---

## 🔧 Funcionalidades Mantenidas

Todas las funcionalidades anteriores se mantienen:

✅ Exportación CSV y XLSX  
✅ Exportación masiva  
✅ Estadísticas por parcela  
✅ Múltiples lotes y parcelas  
✅ Cálculo automático de CAP  
✅ Densidad por hectárea  
✅ Funcionamiento offline  
✅ Respaldo local automático  

---

## 🛠️ Actualización desde v3.2

### Paso 1: Backup (CRÍTICO)
```
1. Abre tu app v3.2
2. Click "Exportar Todo"
3. Descarga CSV completo
4. Guarda en lugar seguro
```

### Paso 2: Subir Archivos Nuevos
Reemplaza en GitHub Pages:
- ✅ `index.html` → Campo nuevo de número de árbol
- ✅ `script.js` → Lógica de numeración manual
- ✅ `manifest.json` → Versión 3.3.0
- ✅ `sw.js` → Cache v3.3

### Paso 3: Actualización Automática
```
1. Sube archivos a GitHub Pages
2. Espera 3-5 minutos
3. Abre app en móvil
4. Verifica "v3.3" en header
```

---

## ⚠️ Compatibilidad con Datos Anteriores

### ¿Qué pasa con mis datos de v3.2?

**✅ TOTALMENTE COMPATIBLE**

Los datos existentes de v3.2 (con numeración automática 1, 2, 3...) funcionarán perfectamente en v3.3:

- Se mantienen como están
- Se pueden exportar normalmente
- Se pueden seguir editando

### Migración Natural:

Las **parcelas nuevas** usarán numeración manual, mientras que las **parcelas existentes** mantendrán su numeración original.

---

## 📱 Flujo de Trabajo Mejorado

### Trabajo en Campo:

```
1. Llegas a la parcela
2. Los árboles están marcados (1, 2, 3... 30)
3. Abres la app → Seleccionas Lote y Parcela
4. Empiezas a medir:
   
   Árbol 1 → Muerto → Saltar
   Árbol 2 → Muerto → Saltar
   Árbol 3 → Medir
      ↓
   App: "Número de Árbol: _"
   Tú: 3 [Enter]
   App: "DAP: _"
   Tú: 25.5 [Enter]
   ✅ Guardado
   
   Árbol 10 → Medir
      ↓
   App: "Número de Árbol: _"
   Tú: 10 [Enter]
   App: "DAP: _"
   Tú: 30.2 [Enter]
   ✅ Guardado
   
5. Continúas con todos los árboles medibles
6. Al terminar → Exportar datos
```

---

## 🎯 Ventajas de la Numeración Manual

### ✅ Precisión en Campo:
- Refleja números reales de árboles marcados
- Permite identificar árboles específicos después
- Facilita re-mediciones en el futuro

### ✅ Flexibilidad:
- Mide en cualquier orden
- Omite árboles muertos o no medibles
- Corrige errores fácilmente

### ✅ Trazabilidad:
- Número de árbol = ID único permanente
- Fácil ubicar árbol en campo con exportación
- Mejor para análisis posteriores

### ✅ Trabajo Real:
- No todos los árboles se miden siempre
- Árboles muertos, caídos, muy pequeños
- Errores de marcación en campo

---

## 🔍 Casos de Uso Adicionales

### 1. Re-medición de Parcelas:
```
Primera medición (2024):
- Árboles: 3, 10, 15, 25

Segunda medición (2025):
- Mismo números → Fácil comparar crecimiento
- Árbol 3 ya no existe → Solo medir 10, 15, 25
```

### 2. Corrección de Errores:
```
Mediste mal el árbol 15:
1. Vuelve a ingresar: Árbol 15
2. Ingresa DAP correcto
3. Confirma reemplazo
✅ Medición actualizada
```

### 3. Parcelas con Marcación Irregular:
```
Árboles marcados: 5, 12, 23, 47, 88
→ App maneja sin problemas
```

---

## 📊 Estadísticas Precisas

### Total de Árboles:
Cuenta solo árboles **medidos**, no el número más alto.

**Ejemplo:**
- Mediste: Árbol 3, 10, 15, 25
- Total: **4 árboles** (no 25)
- Densidad: 4 árboles / 500m² = 80 árboles/ha

### DAP Promedio:
Promedio de los árboles medidos, sin importar sus números.

---

## ⚡ Atajos de Teclado

### En Mediciones:
- `Enter` en Número de Árbol → Pasa a DAP
- `Enter` en DAP → Guarda y vuelve a Número de Árbol

### Navegación Rápida:
```
Lote → Enter → Parcela
Parcela → Enter → Número de Árbol
Número → Enter → DAP
DAP → Enter → (repite ciclo)
```

---

## 🐛 Solución de Problemas

### Problema: "No puedo omitir números"
**Solución:** Simplemente no ingreses esos números. Solo ingresa los árboles que mediste.

### Problema: "Medí mal un árbol"
**Solución:** Vuelve a ingresar el mismo número de árbol y confirma el reemplazo.

### Problema: "Los números no están ordenados en pantalla"
**Solución:** La app los ordena automáticamente al mostrarlos.

### Problema: "Mis datos de v3.2 tienen numeración 1,2,3..."
**Solución:** Esos datos están bien. Las parcelas nuevas usarán numeración manual.

---

## 📁 Archivos de la Aplicación

### Modificados en v3.3:
- ✅ `index.html` → Campo de número de árbol
- ✅ `script.js` → Validación y lógica manual
- ✅ `manifest.json` → v3.3.0
- ✅ `sw.js` → Cache v3.3

### Sin Cambios:
- ✅ `icon-192.png`
- ✅ `icon-512.png`

---

## ✅ Checklist de Actualización

- [ ] Exportar datos actuales (backup)
- [ ] Descargar archivos v3.3
- [ ] Subir a GitHub Pages
- [ ] Esperar 3-5 minutos
- [ ] Verificar v3.3 en navegador
- [ ] Probar nueva funcionalidad
- [ ] Crear parcela de prueba
- [ ] Medir con números no consecutivos
- [ ] Verificar ordenamiento
- [ ] Probar validación de duplicados
- [ ] Exportar CSV y verificar

---

## 🎉 Resumen de Mejoras

### v3.3 vs v3.2:

| Característica | v3.2 | v3.3 |
|---------------|------|------|
| Numeración árboles | Automática | **Manual** ✨ |
| Números consecutivos | Obligatorio | **Opcional** ✨ |
| Validación duplicados | No | **Sí** ✨ |
| Orden flexible | No | **Sí** ✨ |
| Refleja campo real | Limitado | **Completo** ✨ |
| Exportación CSV/XLSX | ✅ | ✅ |
| Offline | ✅ | ✅ |
| Estadísticas | ✅ | ✅ |

---

**Versión:** 3.3.0  
**Fecha:** Noviembre 2025  
**Cambios:** Numeración manual de árboles con validación de duplicados
