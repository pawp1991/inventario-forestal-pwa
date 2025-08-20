# Inventario Forestal PWA

Progressive Web App para captura de mediciones DAP en inventarios forestales.

## 🚀 Instalación

1. Descarga todos los archivos en una carpeta
2. Crea la carpeta `icons/` 
3. Agrega los iconos `icon-192.png` e `icon-512.png`
4. Sube los archivos a un servidor web con HTTPS

## 📱 Uso

1. Abre la aplicación en un navegador móvil
2. Aparecerá el botón "Instalar App" para instalación PWA
3. Completa lote y parcela para comenzar captura
4. Ingresa número de árbol y DAP
5. Usa botones de edición/eliminación según necesites
6. Guarda parcela al finalizar
7. Exporta datos en CSV/TXT cuando regreses a zona con internet

## 🛠️ Características

- ✅ Funciona offline una vez instalada
- ✅ Interfaz responsive para móviles
- ✅ Persistencia de datos en localStorage
- ✅ Exportación a CSV y TXT
- ✅ Control de fechas automático
- ✅ Validaciones de entrada
- ✅ Edición y corrección de mediciones

## 📋 Requisitos

- Servidor web con HTTPS (para PWA)
- Navegador moderno compatible con PWA
- JavaScript habilitado

## 🔧 Desarrollo

Para desarrollo local, usa un servidor HTTP simple:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# Live Server (VSCode)