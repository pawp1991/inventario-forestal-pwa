// Variables globales
let inventario = {};
let loteActual = null;
let parcelaActual = null;

// Cargar datos del localStorage al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    actualizarInterfaz();
    actualizarEstadisticasGlobales();
    
    // Event listeners
    document.getElementById('seleccionarLoteBtn').addEventListener('click', seleccionarLote);
    document.getElementById('iniciarParcelaBtn').addEventListener('click', iniciarParcela);
    document.getElementById('agregarDapBtn').addEventListener('click', agregarMedicion);
    document.getElementById('nuevaParcelaBtn').addEventListener('click', nuevaParcela);
    document.getElementById('nuevoLoteBtn').addEventListener('click', nuevoLote);
    document.getElementById('exportarLoteBtn').addEventListener('click', () => exportarLote(loteActual));
    document.getElementById('exportTodoBtn').addEventListener('click', mostrarSeccionExportacion);
    document.getElementById('exportCompletCSVBtn').addEventListener('click', () => exportarInventarioCompleto('csv'));
    document.getElementById('exportCompletXLSXBtn').addEventListener('click', () => exportarInventarioCompleto('xlsx'));
    document.getElementById('exportEstadisticasBtn').addEventListener('click', exportarEstadisticas);
    
    // Enter en campos de texto
    document.getElementById('nombreLoteInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') seleccionarLote();
    });
    document.getElementById('numeroParcelaInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') iniciarParcela();
    });
    document.getElementById('numeroArbolInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('dapInput').focus();
        }
    });
    document.getElementById('dapInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') agregarMedicion();
    });
});

// Funciones de gestión de lote
function seleccionarLote() {
    const nombreLote = document.getElementById('nombreLoteInput').value.trim();
    if (!nombreLote) {
        alert('Por favor ingrese un nombre de lote');
        return;
    }
    
    loteActual = nombreLote;
    
    if (!inventario[nombreLote]) {
        inventario[nombreLote] = {
            fechaCreacion: obtenerFechaActual(),
            parcelas: {}
        };
    }
    
    document.getElementById('nombreLoteActual').textContent = nombreLote;
    document.getElementById('loteActualInfo').classList.remove('hidden');
    document.getElementById('panelParcela').classList.remove('hidden');
    document.getElementById('numeroParcelaInput').focus();
    
    guardarDatos();
    actualizarResumen();
    actualizarEstadisticasGlobales();
}

function iniciarParcela() {
    if (!loteActual) {
        alert('Primero debe seleccionar un lote');
        return;
    }
    
    const numeroParcela = document.getElementById('numeroParcelaInput').value.trim();
    if (!numeroParcela) {
        alert('Por favor ingrese un número de parcela');
        return;
    }
    
    const claveParcela = `${loteActual}_${numeroParcela}_${obtenerFechaActual()}`;
    parcelaActual = claveParcela;
    
    if (!inventario[loteActual].parcelas[claveParcela]) {
        inventario[loteActual].parcelas[claveParcela] = {
            numero: numeroParcela,
            fecha: obtenerFechaActual(),
            mediciones: [],
            totalArboles: 0,
            dapPromedio: 0,
            capPromedio: 0,
            densidadHa: 0,
            areaParcela: 500
        };
    }
    
    document.getElementById('numeroParcelaActual').textContent = numeroParcela;
    document.getElementById('fechaParcelaActual').textContent = `Fecha: ${obtenerFechaActual()}`;
    document.getElementById('parcelaActualInfo').classList.remove('hidden');
    document.getElementById('panelMediciones').classList.remove('hidden');
    document.getElementById('botonesAccion').classList.remove('hidden');
    document.getElementById('numeroArbolInput').focus();
    
    actualizarContadorArboles();
    actualizarListaMediciones();
    guardarDatos();
}

function agregarMedicion() {
    if (!parcelaActual) {
        alert('Primero debe iniciar una parcela');
        return;
    }
    
    const numeroArbolInput = document.getElementById('numeroArbolInput');
    const dapInput = document.getElementById('dapInput');
    
    const numeroArbol = parseInt(numeroArbolInput.value);
    const dap = parseFloat(dapInput.value);
    
    // Validar número de árbol
    if (!numeroArbol || numeroArbol <= 0) {
        alert('Por favor ingrese un número de árbol válido');
        numeroArbolInput.focus();
        return;
    }
    
    // Validar DAP
    if (!dap || dap <= 0) {
        alert('Por favor ingrese un valor de DAP válido');
        dapInput.focus();
        return;
    }
    
    const parcela = inventario[loteActual].parcelas[parcelaActual];
    
    // Verificar si el número de árbol ya existe
    const arbolExistente = parcela.mediciones.find(m => m.numeroArbol === numeroArbol);
    if (arbolExistente) {
        const confirmar = confirm(
            `⚠️ El árbol ${numeroArbol} ya fue medido con DAP ${arbolExistente.dap} cm.\n\n` +
            `¿Desea reemplazar la medición anterior?`
        );
        
        if (confirmar) {
            // Reemplazar medición existente
            arbolExistente.dap = dap.toFixed(1);
            arbolExistente.cap = (dap * Math.PI).toFixed(1);
            arbolExistente.timestamp = new Date().toISOString();
        } else {
            numeroArbolInput.focus();
            return;
        }
    } else {
        // Agregar nueva medición
        const cap = dap * Math.PI;
        
        parcela.mediciones.push({
            numeroArbol: numeroArbol,
            dap: dap.toFixed(1),
            cap: cap.toFixed(1),
            timestamp: new Date().toISOString()
        });
    }
    
    // Actualizar estadísticas
    actualizarEstadisticasParcela(parcela);
    
    // Limpiar campos y volver al número de árbol
    numeroArbolInput.value = '';
    dapInput.value = '';
    numeroArbolInput.focus();
    
    actualizarContadorArboles();
    actualizarListaMediciones();
    guardarDatos();
    actualizarEstadisticasGlobales();
}

function actualizarEstadisticasParcela(parcela) {
    const n = parcela.mediciones.length;
    parcela.totalArboles = n;
    
    if (n > 0) {
        const sumaDap = parcela.mediciones.reduce((sum, m) => sum + parseFloat(m.dap), 0);
        const sumaCap = parcela.mediciones.reduce((sum, m) => sum + parseFloat(m.cap), 0);
        
        parcela.dapPromedio = (sumaDap / n).toFixed(1);
        parcela.capPromedio = (sumaCap / n).toFixed(1);
        parcela.densidadHa = Math.round((n / parcela.areaParcela) * 10000);
    }
}

function actualizarContadorArboles() {
    const parcela = inventario[loteActual].parcelas[parcelaActual];
    document.getElementById('contadorArboles').textContent = parcela.totalArboles;
}

function actualizarListaMediciones() {
    const lista = document.getElementById('listaMediciones');
    const parcela = inventario[loteActual].parcelas[parcelaActual];
    
    lista.innerHTML = '';
    
    if (parcela.mediciones.length === 0) {
        lista.innerHTML = '<p class="text-gray-500 text-center py-4">No hay mediciones aún</p>';
        return;
    }
    
    // Ordenar mediciones por número de árbol para mejor visualización
    const medicionesOrdenadas = [...parcela.mediciones].sort((a, b) => a.numeroArbol - b.numeroArbol);
    
    medicionesOrdenadas.forEach((medicion) => {
        const div = document.createElement('div');
        div.className = 'bg-green-50 p-3 rounded-lg flex justify-between items-center border border-green-200';
        div.innerHTML = `
            <div>
                <span class="font-bold text-green-800">Árbol ${medicion.numeroArbol}</span>
                <span class="text-gray-600 ml-2">DAP: ${medicion.dap} cm</span>
                <span class="text-gray-600 ml-2">CAP: ${medicion.cap} cm</span>
            </div>
            <button onclick="eliminarMedicion(${medicion.numeroArbol})" class="text-red-600 hover:text-red-800">
                <i data-lucide="trash-2" class="w-5 h-5"></i>
            </button>
        `;
        lista.appendChild(div);
    });
    
    lucide.createIcons();
}

function eliminarMedicion(numeroArbol) {
    if (!confirm(`¿Está seguro de eliminar la medición del árbol ${numeroArbol}?`)) return;
    
    const parcela = inventario[loteActual].parcelas[parcelaActual];
    
    // Encontrar índice de la medición por número de árbol
    const index = parcela.mediciones.findIndex(m => m.numeroArbol === numeroArbol);
    
    if (index === -1) {
        alert('Error: No se encontró la medición');
        return;
    }
    
    parcela.mediciones.splice(index, 1);
    
    actualizarEstadisticasParcela(parcela);
    actualizarContadorArboles();
    actualizarListaMediciones();
    guardarDatos();
    actualizarEstadisticasGlobales();
}

function nuevaParcela() {
    parcelaActual = null;
    document.getElementById('numeroParcelaInput').value = '';
    document.getElementById('parcelaActualInfo').classList.add('hidden');
    document.getElementById('panelMediciones').classList.add('hidden');
    document.getElementById('numeroParcelaInput').focus();
}

function nuevoLote() {
    loteActual = null;
    parcelaActual = null;
    document.getElementById('nombreLoteInput').value = '';
    document.getElementById('numeroParcelaInput').value = '';
    document.getElementById('loteActualInfo').classList.add('hidden');
    document.getElementById('panelParcela').classList.add('hidden');
    document.getElementById('parcelaActualInfo').classList.add('hidden');
    document.getElementById('panelMediciones').classList.add('hidden');
    document.getElementById('botonesAccion').classList.add('hidden');
    document.getElementById('nombreLoteInput').focus();
}

// Funciones de exportación
function exportarLote(nombreLote) {
    if (!nombreLote || !inventario[nombreLote]) {
        alert('No hay datos para exportar');
        return;
    }
    
    // Mostrar opciones de formato
    const formato = confirm('¿Exportar en formato Excel (XLSX)?\n\nAceptar = XLSX\nCancelar = CSV');
    
    if (formato) {
        exportarLoteXLSX(nombreLote);
    } else {
        exportarLoteCSV(nombreLote);
    }
}

function exportarLoteCSV(nombreLote) {
    const datosLote = inventario[nombreLote];
    if (!datosLote || !datosLote.parcelas) return;
    
    let csvContent = 'Lote,Parcela,Fecha,Numero_Arbol,DAP_cm,CAP_cm,Densidad_ha\n';
    
    Object.values(datosLote.parcelas).forEach(parcela => {
        parcela.mediciones.forEach(medicion => {
            csvContent += `${nombreLote},${parcela.numero},${parcela.fecha},${medicion.numeroArbol},${medicion.dap},${medicion.cap},${parcela.densidadHa}\n`;
        });
    });
    
    descargarArchivo(csvContent, `Inventario_${nombreLote}_${obtenerFechaActual()}.csv`, 'text/csv');
}

function exportarLoteXLSX(nombreLote) {
    const datosLote = inventario[nombreLote];
    if (!datosLote || !datosLote.parcelas) return;
    
    // Preparar datos para Excel
    const datos = [];
    datos.push(['Lote', 'Parcela', 'Fecha', 'Numero_Arbol', 'DAP_cm', 'CAP_cm', 'Densidad_ha']);
    
    Object.values(datosLote.parcelas).forEach(parcela => {
        parcela.mediciones.forEach(medicion => {
            datos.push([
                nombreLote,
                parcela.numero,
                parcela.fecha,
                medicion.numeroArbol,
                parseFloat(medicion.dap),
                parseFloat(medicion.cap),
                parcela.densidadHa
            ]);
        });
    });
    
    // Crear libro de Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datos);
    
    // Ajustar ancho de columnas
    ws['!cols'] = [
        { wch: 15 }, // Lote
        { wch: 10 }, // Parcela
        { wch: 12 }, // Fecha
        { wch: 12 }, // Numero_Arbol
        { wch: 10 }, // DAP_cm
        { wch: 10 }, // CAP_cm
        { wch: 12 }  // Densidad_ha
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    
    // Descargar archivo
    XLSX.writeFile(wb, `Inventario_${nombreLote}_${obtenerFechaActual()}.xlsx`);
}

function mostrarSeccionExportacion() {
    const seccion = document.getElementById('seccionExportacion');
    
    if (Object.keys(inventario).length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    // Calcular estadísticas
    let totalLotes = 0;
    let totalParcelas = 0;
    let totalArboles = 0;
    
    Object.values(inventario).forEach(lote => {
        totalLotes++;
        if (lote.parcelas) {
            Object.values(lote.parcelas).forEach(parcela => {
                totalParcelas++;
                totalArboles += parcela.totalArboles;
            });
        }
    });
    
    // Actualizar estadísticas en la sección
    document.getElementById('exportTotalLotes').textContent = totalLotes;
    document.getElementById('exportTotalParcelas').textContent = totalParcelas;
    document.getElementById('exportTotalArboles').textContent = totalArboles;
    
    // Mostrar sección y hacer scroll
    seccion.classList.remove('hidden');
    seccion.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function exportarInventarioCompleto(formato = 'csv') {
    if (Object.keys(inventario).length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    const incluirEstadisticas = document.getElementById('incluirEstadisticas').checked;
    const incluirFechaExport = document.getElementById('incluirFechaExport').checked;
    
    if (formato === 'xlsx') {
        exportarInventarioCompletoXLSX(incluirEstadisticas, incluirFechaExport);
    } else {
        exportarInventarioCompletoCSV(incluirEstadisticas, incluirFechaExport);
    }
}

function exportarInventarioCompletoCSV(incluirEstadisticas, incluirFechaExport) {
    let csvContent = 'Lote,Parcela,Fecha_Medicion,Numero_Arbol,DAP_cm,CAP_cm';
    
    if (incluirEstadisticas) {
        csvContent += ',Total_Arboles,DAP_Promedio,Densidad_ha';
    }
    
    csvContent += '\n';
    
    let stats = { totalLotes: 0, totalParcelas: 0, totalArboles: 0 };
    
    Object.entries(inventario).forEach(([nombreLote, datosLote]) => {
        stats.totalLotes++;
        if (datosLote.parcelas) {
            Object.values(datosLote.parcelas).forEach(parcela => {
                stats.totalParcelas++;
                stats.totalArboles += parcela.totalArboles;
                
                parcela.mediciones.forEach(medicion => {
                    csvContent += `${nombreLote},${parcela.numero},${parcela.fecha},${medicion.numeroArbol},${medicion.dap},${medicion.cap}`;
                    
                    if (incluirEstadisticas) {
                        csvContent += `,${parcela.totalArboles},${parcela.dapPromedio},${parcela.densidadHa}`;
                    }
                    
                    csvContent += '\n';
                });
            });
        }
    });
    
    const fechaExport = incluirFechaExport ? obtenerFechaActual() : '';
    const fileName = incluirFechaExport 
        ? `InventarioForestal_${stats.totalLotes}L_${stats.totalParcelas}P_${fechaExport}.csv`
        : `InventarioForestal_${stats.totalLotes}L_${stats.totalParcelas}P.csv`;
    
    descargarArchivo(csvContent, fileName, 'text/csv');
    
    alert(`✅ Inventario exportado (CSV):\n\n📊 ${stats.totalLotes} lotes\n📍 ${stats.totalParcelas} parcelas\n🌲 ${stats.totalArboles} árboles\n📁 ${fileName}`);
}

function exportarInventarioCompletoXLSX(incluirEstadisticas, incluirFechaExport) {
    // Preparar encabezados
    const headers = ['Lote', 'Parcela', 'Fecha_Medicion', 'Numero_Arbol', 'DAP_cm', 'CAP_cm'];
    
    if (incluirEstadisticas) {
        headers.push('Total_Arboles', 'DAP_Promedio', 'Densidad_ha');
    }
    
    const datos = [headers];
    let stats = { totalLotes: 0, totalParcelas: 0, totalArboles: 0 };
    
    Object.entries(inventario).forEach(([nombreLote, datosLote]) => {
        stats.totalLotes++;
        if (datosLote.parcelas) {
            Object.values(datosLote.parcelas).forEach(parcela => {
                stats.totalParcelas++;
                stats.totalArboles += parcela.totalArboles;
                
                parcela.mediciones.forEach(medicion => {
                    const fila = [
                        nombreLote,
                        parcela.numero,
                        parcela.fecha,
                        medicion.numeroArbol,
                        parseFloat(medicion.dap),
                        parseFloat(medicion.cap)
                    ];
                    
                    if (incluirEstadisticas) {
                        fila.push(
                            parcela.totalArboles,
                            parseFloat(parcela.dapPromedio),
                            parcela.densidadHa
                        );
                    }
                    
                    datos.push(fila);
                });
            });
        }
    });
    
    // Crear libro de Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datos);
    
    // Ajustar ancho de columnas
    const colWidths = [15, 10, 15, 12, 10, 10];
    if (incluirEstadisticas) {
        colWidths.push(12, 12, 12);
    }
    ws['!cols'] = colWidths.map(w => ({ wch: w }));
    
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario Completo');
    
    // Nombre del archivo
    const fechaExport = incluirFechaExport ? obtenerFechaActual() : '';
    const fileName = incluirFechaExport 
        ? `InventarioForestal_${stats.totalLotes}L_${stats.totalParcelas}P_${fechaExport}.xlsx`
        : `InventarioForestal_${stats.totalLotes}L_${stats.totalParcelas}P.xlsx`;
    
    // Descargar archivo
    XLSX.writeFile(wb, fileName);
    
    alert(`✅ Inventario exportado (XLSX):\n\n📊 ${stats.totalLotes} lotes\n📍 ${stats.totalParcelas} parcelas\n🌲 ${stats.totalArboles} árboles\n📁 ${fileName}`);
}

function exportarEstadisticas() {
    if (Object.keys(inventario).length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    let csvContent = 'Lote,Parcela,Fecha,Total_Arboles,DAP_Promedio,CAP_Promedio,Densidad_ha\n';
    let stats = { totalLotes: 0, totalParcelas: 0, totalArboles: 0 };
    
    Object.entries(inventario).forEach(([nombreLote, datosLote]) => {
        stats.totalLotes++;
        if (datosLote.parcelas) {
            Object.values(datosLote.parcelas).forEach(parcela => {
                stats.totalParcelas++;
                stats.totalArboles += parcela.totalArboles;
                csvContent += `${nombreLote},${parcela.numero},${parcela.fecha},${parcela.totalArboles},${parcela.dapPromedio},${parcela.capPromedio},${parcela.densidadHa}\n`;
            });
        }
    });
    
    const fechaExport = obtenerFechaActual();
    const fileName = `Estadisticas_${stats.totalLotes}L_${stats.totalParcelas}P_${fechaExport}.csv`;
    
    descargarArchivo(csvContent, fileName, 'text/csv');
    alert(`✅ Estadísticas exportadas:\n\n📊 Resumen por parcela generado\n📁 Archivo: ${fileName}`);
}

// Funciones auxiliares
function descargarArchivo(contenido, nombreArchivo, tipoMime) {
    const blob = new Blob([contenido], { type: tipoMime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function obtenerFechaActual() {
    const fecha = new Date();
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

function actualizarEstadisticasGlobales() {
    let totalLotes = 0;
    let totalParcelas = 0;
    let totalArboles = 0;
    
    Object.values(inventario).forEach(lote => {
        totalLotes++;
        if (lote.parcelas) {
            Object.values(lote.parcelas).forEach(parcela => {
                totalParcelas++;
                totalArboles += parcela.totalArboles;
            });
        }
    });
    
    document.getElementById('totalLotesGlobal').textContent = totalLotes;
    document.getElementById('totalParcelasGlobal').textContent = totalParcelas;
    document.getElementById('totalArbolesGlobal').textContent = totalArboles;
}

function actualizarResumen() {
    const resumen = document.getElementById('resumenDatos');
    const lista = document.getElementById('listaLotes');
    
    if (Object.keys(inventario).length === 0) {
        resumen.classList.add('hidden');
        return;
    }
    
    resumen.classList.remove('hidden');
    lista.innerHTML = '';
    
    Object.entries(inventario).forEach(([nombreLote, datosLote]) => {
        const totalParcelas = Object.keys(datosLote.parcelas || {}).length;
        let totalArboles = 0;
        
        Object.values(datosLote.parcelas || {}).forEach(parcela => {
            totalArboles += parcela.totalArboles;
        });
        
        const div = document.createElement('div');
        div.className = 'bg-green-50 p-4 rounded-lg border border-green-200';
        div.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-bold text-green-800">${nombreLote}</h3>
                    <p class="text-sm text-gray-600">
                        ${totalParcelas} parcela(s) • ${totalArboles} árbol(es)
                    </p>
                    <p class="text-xs text-gray-500">Creado: ${datosLote.fechaCreacion}</p>
                </div>
                <button onclick="exportarLote('${nombreLote}')" class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                    <i data-lucide="download" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        lista.appendChild(div);
    });
    
    lucide.createIcons();
}

function actualizarInterfaz() {
    actualizarResumen();
    if (loteActual) {
        document.getElementById('nombreLoteActual').textContent = loteActual;
        document.getElementById('loteActualInfo').classList.remove('hidden');
        document.getElementById('panelParcela').classList.remove('hidden');
    }
    if (parcelaActual) {
        const parcela = inventario[loteActual].parcelas[parcelaActual];
        document.getElementById('numeroParcelaActual').textContent = parcela.numero;
        document.getElementById('fechaParcelaActual').textContent = `Fecha: ${parcela.fecha}`;
        document.getElementById('parcelaActualInfo').classList.remove('hidden');
        document.getElementById('panelMediciones').classList.remove('hidden');
        document.getElementById('botonesAccion').classList.remove('hidden');
        actualizarContadorArboles();
        actualizarListaMediciones();
    }
}

// Funciones de almacenamiento
function guardarDatos() {
    localStorage.setItem('inventarioForestal', JSON.stringify(inventario));
}

function cargarDatos() {
    const datosGuardados = localStorage.getItem('inventarioForestal');
    if (datosGuardados) {
        inventario = JSON.parse(datosGuardados);
    }
}

// Registrar Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('Service Worker registrado', reg))
        .catch(err => console.error('Error al registrar Service Worker', err));
}
