// Variables globales
let inventario = {};
let medicionesActuales = [];
let loteActual = '';
let parcelaActual = '';
let deferredPrompt = null;
let parcelaEditandoKey = null;
let deleteTarget = null;

// DOM Elements
const elements = {
    loteInput: document.getElementById('loteInput'),
    parcelaInput: document.getElementById('parcelaInput'),
    editParcelaBtn: document.getElementById('editParcelaBtn'),
    fechaDisplay: document.getElementById('fechaDisplay'),
    capturaSection: document.getElementById('capturaSection'),
    capturaTitle: document.getElementById('capturaTitle'),
    numeroArbolInput: document.getElementById('numeroArbolInput'),
    dapInput: document.getElementById('dapInput'),
    agregarBtn: document.getElementById('agregarBtn'),
    deshacerBtn: document.getElementById('deshacerBtn'),
    medicionesList: document.getElementById('medicionesList'),
    medicionesTitle: document.getElementById('medicionesTitle'),
    medicionesGrid: document.getElementById('medicionesGrid'),
    promedioDisplay: document.getElementById('promedioDisplay'),
    densidadDisplay: document.getElementById('densidadDisplay'),
    guardarBtn: document.getElementById('guardarBtn'),
    nuevaParcelaBtn: document.getElementById('nuevaParcelaBtn'),
    nuevoLoteBtn: document.getElementById('nuevoLoteBtn'),
    datosGuardados: document.getElementById('datosGuardados'),
    installButton: document.getElementById('installButton'),
    backupStatus: document.getElementById('backupStatus'),
    backupStatusText: document.getElementById('backupStatusText'),
    exportAllBtn: document.getElementById('exportAllBtn'),
    deleteAllBtn: document.getElementById('deleteAllBtn'),
    exportSection: document.getElementById('exportSection'),
    exportTotalLotes: document.getElementById('exportTotalLotes'),
    exportTotalParcelas: document.getElementById('exportTotalParcelas'),
    exportTotalArboles: document.getElementById('exportTotalArboles'),
    incluirEstadisticas: document.getElementById('incluirEstadisticas'),
    incluirFechaExport: document.getElementById('incluirFechaExport'),
    exportCompletBtn: document.getElementById('exportCompletBtn'),
    exportEstadisticasBtn: document.getElementById('exportEstadisticasBtn'),
    totalLotes: document.getElementById('totalLotes'),
    totalParcelas: document.getElementById('totalParcelas'),
    totalArboles: document.getElementById('totalArboles'),
    editParcelaModal: document.getElementById('editParcelaModal'),
    nuevoNumeroParcelaInput: document.getElementById('nuevoNumeroParcelaInput'),
    confirmarEditParcelaBtn: document.getElementById('confirmarEditParcelaBtn'),
    cancelarEditParcelaBtn: document.getElementById('cancelarEditParcelaBtn'),
    deleteModal: document.getElementById('deleteModal'),
    deleteMessage: document.getElementById('deleteMessage'),
    confirmarDeleteBtn: document.getElementById('confirmarDeleteBtn'),
    cancelarDeleteBtn: document.getElementById('cancelarDeleteBtn')
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupPWA();
    loadData();
});

function initializeApp() {
    // Mostrar fecha actual
    elements.fechaDisplay.value = obtenerFechaActual();
    
    // Inicializar iconos de Lucide
    if (window.lucide) {
        lucide.createIcons();
    }
    
    // Cargar datos del localStorage si existen
    const datosGuardadosLS = localStorage.getItem('inventarioForestal');
    if (datosGuardadosLS) {
        try {
            inventario = JSON.parse(datosGuardadosLS);
            actualizarVisualizacionDatos();
        } catch (e) {
            console.error('Error cargando datos:', e);
        }
    }
    
    // Mostrar status de respaldo
    updateBackupStatus('active');
    
    // Actualizar estadísticas globales
    actualizarEstadisticasGlobales();
}

function setupEventListeners() {
    // Inputs principales
    elements.loteInput.addEventListener('input', handleLoteChange);
    elements.parcelaInput.addEventListener('input', handleParcelaChange);
    elements.editParcelaBtn.addEventListener('click', editarNumeroParcela);
    
    // Captura de mediciones
    elements.numeroArbolInput.addEventListener('keypress', handleEnterKey);
    elements.dapInput.addEventListener('keypress', handleEnterKey);
    elements.agregarBtn.addEventListener('click', agregarMedicion);
    elements.deshacerBtn.addEventListener('click', deshacerUltimaMedicion);
    
    // Botones de acción
    elements.guardarBtn.addEventListener('click', guardarParcela);
    elements.nuevaParcelaBtn.addEventListener('click', nuevaParcela);
    elements.nuevoLoteBtn.addEventListener('click', nuevoLote);
    
    // PWA Install
    elements.installButton.addEventListener('click', instalarPWA);
    
    // Exportar y eliminar
    elements.exportAllBtn.addEventListener('click', mostrarSeccionExportacion);
    elements.deleteAllBtn.addEventListener('click', () => confirmarEliminacion('all'));
    elements.exportCompletBtn.addEventListener('click', exportarInventarioCompleto);
    elements.exportEstadisticasBtn.addEventListener('click', exportarEstadisticas);
    
    // Modal de edición
    elements.confirmarEditParcelaBtn.addEventListener('click', confirmarEdicionParcela);
    elements.cancelarEditParcelaBtn.addEventListener('click', cerrarModalEdicion);
    elements.editParcelaModal.addEventListener('click', (e) => {
        if (e.target === elements.editParcelaModal) {
            cerrarModalEdicion();
        }
    });
    
    // Modal de eliminación
    elements.confirmarDeleteBtn.addEventListener('click', ejecutarEliminacion);
    elements.cancelarDeleteBtn.addEventListener('click', cerrarModalEliminacion);
    elements.deleteModal.addEventListener('click', (e) => {
        if (e.target === elements.deleteModal) {
            cerrarModalEliminacion();
        }
    });
}

function setupPWA() {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => console.log('SW registrado:', registration))
            .catch(error => console.log('SW falló:', error));
    }
    
    // PWA Install Prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        elements.installButton.classList.remove('hidden');
    });
    
    // Detectar cuando la app es instalada
    window.addEventListener('appinstalled', () => {
        elements.installButton.classList.add('hidden');
        console.log('PWA instalada exitosamente');
    });
}

// Funciones de estadísticas globales
function calcularEstadisticasGlobales() {
    let totalLotes = 0;
    let totalParcelas = 0;
    let totalArboles = 0;
    
    Object.entries(inventario).forEach(([nombreLote, datosLote]) => {
        totalLotes++;
        if (datosLote.parcelas) {
            Object.values(datosLote.parcelas).forEach(parcela => {
                totalParcelas++;
                totalArboles += parcela.totalArboles;
            });
        }
    });
    
    return { totalLotes, totalParcelas, totalArboles };
}

function actualizarEstadisticasGlobales() {
    const stats = calcularEstadisticasGlobales();
    
    // Actualizar header
    elements.totalLotes.textContent = `${stats.totalLotes} lotes`;
    elements.totalParcelas.textContent = `${stats.totalParcelas} parcelas`;
    elements.totalArboles.textContent = `${stats.totalArboles} árboles`;
    
    // Actualizar sección de exportación
    elements.exportTotalLotes.textContent = stats.totalLotes;
    elements.exportTotalParcelas.textContent = stats.totalParcelas;
    elements.exportTotalArboles.textContent = stats.totalArboles;
    
    // Mostrar/ocultar sección de exportación
    if (stats.totalArboles > 0) {
        elements.exportSection.classList.remove('hidden');
    } else {
        elements.exportSection.classList.add('hidden');
    }
}

function mostrarSeccionExportacion() {
    if (Object.keys(inventario).length === 0) {
        alert('No hay datos para exportar. Primero debe capturar algunas mediciones.');
        return;
    }
    
    // Scroll a la sección de exportación
    elements.exportSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
    });
    
    // Efecto visual
    elements.exportSection.style.animation = 'none';
    setTimeout(() => {
        elements.exportSection.style.animation = 'pulse 1s ease-in-out 2';
    }, 100);
}

// Funciones de exportación mejorada
function updateBackupStatus(status) {
    const statusElement = elements.backupStatus;
    const textElement = elements.backupStatusText;
    const iconElement = statusElement.querySelector('i');
    
    // Remover clases anteriores
    statusElement.classList.remove('saving', 'error');
    
    switch (status) {
        case 'active':
            textElement.textContent = 'Respaldo local activo';
            iconElement.setAttribute('data-lucide', 'hard-drive');
            break;
        case 'saving':
            statusElement.classList.add('saving');
            textElement.textContent = 'Guardando...';
            iconElement.setAttribute('data-lucide', 'loader-2');
            break;
        case 'saved':
            textElement.textContent = 'Datos guardados';
            iconElement.setAttribute('data-lucide', 'check-circle');
            setTimeout(() => updateBackupStatus('active'), 2000);
            break;
        case 'error':
            statusElement.classList.add('error');
            textElement.textContent = 'Error al guardar';
            iconElement.setAttribute('data-lucide', 'alert-circle');
            setTimeout(() => updateBackupStatus('active'), 3000);
            break;
    }
    
    // Reinicializar iconos
    if (window.lucide) {
        lucide.createIcons();
    }
}

async function backupToDevice() {
    try {
        updateBackupStatus('saving');
        
        const fechaBackup = obtenerFechaActual();
        const horaBackup = new Date().toLocaleTimeString().replace(/:/g, '-');
        
        // Generar CSV completo
        let csvContent = 'Lote,Parcela,Fecha,Numero_Arbol,DAP_cm,CAP_cm,Fecha_Backup\n';
        
        Object.entries(inventario).forEach(([nombreLote, datosLote]) => {
            if (datosLote.parcelas) {
                Object.values(datosLote.parcelas).forEach(parcela => {
                    parcela.mediciones.forEach(medicion => {
                        csvContent += `${nombreLote},${parcela.numero},${parcela.fecha},${medicion.numeroArbol},${medicion.dap},${medicion.cap},${fechaBackup}\n`;
                    });
                });
            }
        });
        
        // Guardar usando File System Access API si está disponible
        if ('showSaveFilePicker' in window) {
            try {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: `InventarioForestal_Backup_${fechaBackup}_${horaBackup}.csv`,
                    types: [{
                        description: 'Archivos CSV',
                        accept: { 'text/csv': ['.csv'] }
                    }]
                });
                
                const writable = await fileHandle.createWritable();
                await writable.write(csvContent);
                await writable.close();
                
                updateBackupStatus('saved');
                return;
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.log('File System API no disponible, usando descarga');
                }
            }
        }
        
        // Fallback: descarga automática
        descargarArchivo(csvContent, `InventarioForestal_Backup_${fechaBackup}_${horaBackup}.csv`, 'text/csv');
        updateBackupStatus('saved');
        
    } catch (error) {
        console.error('Error en respaldo:', error);
        updateBackupStatus('error');
    }
}

// Funciones de cálculo forestal
function calcularCAP(dap) {
    // CAP = ENTERO(DAP * π / 5) * 5
    return Math.floor((dap * Math.PI) / 5) * 5;
}

function calcularDensidad(numeroArboles) {
    // n/ha = número de árboles * 20
    return numeroArboles * 20;
}

// Utilidades
function obtenerFechaActual() {
    return new Date().toISOString().split('T')[0];
}

function handleLoteChange() {
    loteActual = elements.loteInput.value.trim();
    actualizarSeccionCaptura();
}

function handleParcelaChange() {
    parcelaActual = elements.parcelaInput.value.trim();
    actualizarSeccionCaptura();
    
    // Mostrar botón de editar si está editando una parcela existente
    if (parcelaEditandoKey) {
        elements.editParcelaBtn.classList.remove('hidden');
    }
}

function actualizarSeccionCaptura() {
    if (loteActual && parcelaActual) {
        elements.capturaSection.classList.remove('hidden');
        const modoTexto = parcelaEditandoKey ? ' (EDITANDO)' : '';
        elements.capturaTitle.textContent = `Mediciones DAP - Lote: ${loteActual}, Parcela: ${parcelaActual}${modoTexto}`;
    } else {
        elements.capturaSection.classList.add('hidden');
    }
}

function handleEnterKey(e) {
    if (e.key === 'Enter') {
        agregarMedicion();
    }
}

// Funciones principales de medición
function agregarMedicion() {
    const numeroArbol = elements.numeroArbolInput.value.trim();
    const dapValue = elements.dapInput.value.trim();
    
    if (!numeroArbol || !dapValue || !loteActual || !parcelaActual) {
        alert('Debe completar todos los campos: Número de Árbol y DAP');
        return;
    }
    
    const numArbol = parseInt(numeroArbol);
    const dap = parseFloat(dapValue);
    
    if (isNaN(numArbol) || numArbol <= 0) {
        alert('Por favor ingrese un número de árbol válido');
        return;
    }
    
    if (isNaN(dap) || dap <= 0) {
        alert('Por favor ingrese un valor de DAP válido');
        return;
    }
    
    // Verificar duplicados
    const existente = medicionesActuales.find(m => m.numeroArbol === numArbol);
    if (existente) {
        alert(`El árbol número ${numArbol} ya fue registrado con DAP ${existente.dap} cm`);
        return;
    }
    
    // Calcular CAP
    const cap = calcularCAP(dap);
    
    // Agregar medición
    medicionesActuales.push({ 
        numeroArbol: numArbol, 
        dap: dap,
        cap: cap
    });
    medicionesActuales.sort((a, b) => a.numeroArbol - b.numeroArbol);
    
    // Limpiar inputs
    elements.numeroArbolInput.value = '';
    elements.dapInput.value = '';
    elements.numeroArbolInput.focus();
    
    // Actualizar visualización
    actualizarListaMediciones();
    actualizarBotones();
}

function deshacerUltimaMedicion() {
    if (medicionesActuales.length === 0) return;
    
    medicionesActuales.pop();
    actualizarListaMediciones();
    actualizarBotones();
}

function eliminarMedicion(numeroArbol) {
    medicionesActuales = medicionesActuales.filter(m => m.numeroArbol !== numeroArbol);
    actualizarListaMediciones();
    actualizarBotones();
}

function editarMedicion(numeroArbol) {
    const medicion = medicionesActuales.find(m => m.numeroArbol === numeroArbol);
    const nuevoValor = prompt(`Editar DAP del Árbol ${numeroArbol} (actual: ${medicion.dap} cm):`, medicion.dap);
    
    if (nuevoValor === null) return;
    
    const nuevoDap = parseFloat(nuevoValor);
    if (isNaN(nuevoDap) || nuevoDap <= 0) {
        alert('Por favor ingrese un valor de DAP válido');
        return;
    }
    
    medicion.dap = nuevoDap;
    medicion.cap = calcularCAP(nuevoDap);
    actualizarListaMediciones();
}

function actualizarListaMediciones() {
    if (medicionesActuales.length === 0) {
        elements.medicionesList.classList.add('hidden');
        return;
    }
    
    elements.medicionesList.classList.remove('hidden');
    elements.medicionesTitle.textContent = `Mediciones capturadas (${medicionesActuales.length} árboles):`;
    
    // Generar grid de mediciones
    elements.medicionesGrid.innerHTML = '';
    medicionesActuales.forEach(medicion => {
        const div = document.createElement('div');
        div.className = 'medicion-card fade-in';
        div.innerHTML = `
            <div class="info">
                <span class="datos">Árbol ${medicion.numeroArbol}: ${medicion.dap} cm</span>
                <div class="botones">
                    <button class="btn-editar" onclick="editarMedicion(${medicion.numeroArbol})" title="Editar">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="btn-eliminar" onclick="eliminarMedicion(${medicion.numeroArbol})" title="Eliminar">
                        <i data-lucide="x"></i>
                    </button>
                </div>
            </div>
            <div class="detalles">
                <span>CAP: ${medicion.cap} cm</span>
            </div>
        `;
        elements.medicionesGrid.appendChild(div);
    });
    
    // Calcular estadísticas
    const daps = medicionesActuales.map(m => m.dap);
    const promedio = daps.reduce((sum, dap) => sum + dap, 0) / daps.length;
    const densidad = calcularDensidad(medicionesActuales.length);
    
    elements.promedioDisplay.textContent = `DAP promedio: ${promedio.toFixed(2)} cm`;
    elements.densidadDisplay.textContent = `Densidad: ${densidad} árboles/ha`;
    
    // Reinicializar iconos
    if (window.lucide) {
        lucide.createIcons();
    }
}

function actualizarBotones() {
    const tieneMediciones = medicionesActuales.length > 0;
    elements.deshacerBtn.classList.toggle('hidden', !tieneMediciones);
    elements.guardarBtn.disabled = !tieneMediciones;
}

function guardarParcela() {
    if (!loteActual || !parcelaActual || medicionesActuales.length === 0) {
        alert('Debe tener al menos una medición para guardar la parcela');
        return;
    }
    
    const fechaActual = obtenerFechaActual();
    const daps = medicionesActuales.map(m => m.dap);
    
    // Inicializar lote si no existe
    if (!inventario[loteActual]) {
        inventario[loteActual] = { parcelas: {} };
    }
    
    let claveUnica;
    if (parcelaEditandoKey) {
        // Editando parcela existente
        claveUnica = parcelaEditandoKey;
    } else {
        // Nueva parcela
        claveUnica = `${fechaActual}_${Date.now()}`;
        claveUnica = `${parcelaActual}_${claveUnica}`;
    }
    
    // Guardar parcela con cálculos
    inventario[loteActual].parcelas[claveUnica] = {
        numero: parcelaActual,
        fecha: fechaActual,
        mediciones: [...medicionesActuales],
        totalArboles: medicionesActuales.length,
        dapPromedio: daps.reduce((a, b) => a + b, 0) / daps.length,
        densidadHa: calcularDensidad(medicionesActuales.length)
    };
    
    // Guardar en localStorage
    saveData();
    
    // Respaldo automático
    backupToDevice();
    
    // Actualizar estadísticas globales
    actualizarEstadisticasGlobales();
    
    // Limpiar estado de edición
    parcelaEditandoKey = null;
    elements.editParcelaBtn.classList.add('hidden');
    
    // Limpiar mediciones actuales
    medicionesActuales = [];
    actualizarListaMediciones();
    actualizarBotones();
    actualizarVisualizacionDatos();
    
    const accion = parcelaEditandoKey ? 'actualizada' : 'guardada';
    alert(`✅ Parcela ${parcelaActual} del lote ${loteActual} ${accion} exitosamente`);
}

function nuevaParcela() {
    if (medicionesActuales.length > 0) {
        const confirmar = confirm('Tiene mediciones sin guardar. ¿Desea guardar la parcela actual antes de continuar?');
        if (confirmar) {
            guardarParcela();
            return;
        }
    }
    
    // Limpiar solo parcela y mediciones
    elements.parcelaInput.value = '';
    parcelaActual = '';
    medicionesActuales = [];
    parcelaEditandoKey = null;
    elements.editParcelaBtn.classList.add('hidden');
    elements.numeroArbolInput.value = '';
    elements.dapInput.value = '';
    
    actualizarListaMediciones();
    actualizarBotones();
    actualizarSeccionCaptura();
    
    // Focus en parcela
    elements.parcelaInput.focus();
}

function nuevoLote() {
    if (medicionesActuales.length > 0) {
        const confirmar = confirm('Tiene mediciones sin guardar. ¿Desea guardar la parcela actual antes de continuar?');
        if (confirmar) {
            guardarParcela();
            return;
        }
    }
    
    // Limpiar todo
    elements.loteInput.value = '';
    elements.parcelaInput.value = '';
    loteActual = '';
    parcelaActual = '';
    medicionesActuales = [];
    parcelaEditandoKey = null;
    elements.editParcelaBtn.classList.add('hidden');
    elements.numeroArbolInput.value = '';
    elements.dapInput.value = '';
    
    actualizarListaMediciones();
    actualizarBotones();
    actualizarSeccionCaptura();
    
    // Focus en lote
    elements.loteInput.focus();
}

// Funciones de edición de parcelas
function editarParcelaGuardada(lote, claveCompleta) {
    const parcela = inventario[lote].parcelas[claveCompleta];
    
    // Confirmar edición
    const confirmar = confirm(`¿Desea editar la parcela ${parcela.numero} del lote ${lote}?\n\nLos datos actuales se cargarán para edición.`);
    if (!confirmar) return;
    
    // Verificar si hay datos sin guardar
    if (medicionesActuales.length > 0) {
        const guardarActual = confirm('Tiene mediciones sin guardar. ¿Desea guardarlas antes de editar otra parcela?');
        if (guardarActual) {
            guardarParcela();
        }
    }
    
    // Cargar datos de la parcela en el formulario
    elements.loteInput.value = lote;
    elements.parcelaInput.value = parcela.numero;
    loteActual = lote;
    parcelaActual = parcela.numero;
    parcelaEditandoKey = claveCompleta;
    
    // Cargar mediciones
    medicionesActuales = [...parcela.mediciones];
    
    // Actualizar interfaz
    actualizarSeccionCaptura();
    actualizarListaMediciones();
    actualizarBotones();
    elements.editParcelaBtn.classList.remove('hidden');
    
    // Scroll hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    alert(`📝 Parcela ${parcela.numero} cargada para edición.\n\nPuede modificar las mediciones y guardar los cambios.`);
}

function editarNumeroParcela() {
    if (!parcelaEditandoKey) return;
    
    elements.nuevoNumeroParcelaInput.value = parcelaActual;
    elements.editParcelaModal.classList.remove('hidden');
    elements.nuevoNumeroParcelaInput.focus();
}

function confirmarEdicionParcela() {
    const nuevoNumero = elements.nuevoNumeroParcelaInput.value.trim();
    
    if (!nuevoNumero) {
        alert('Debe ingresar un número de parcela válido');
        return;
    }
    
    // Actualizar número de parcela
    elements.parcelaInput.value = nuevoNumero;
    parcelaActual = nuevoNumero;
    
    actualizarSeccionCaptura();
    cerrarModalEdicion();
    
    alert(`✅ Número de parcela actualizado a: ${nuevoNumero}`);
}

function cerrarModalEdicion() {
    elements.editParcelaModal.classList.add('hidden');
    elements.nuevoNumeroParcelaInput.value = '';
}

// Funciones de eliminación
function confirmarEliminacion(tipo, lote = null, claveCompleta = null) {
    deleteTarget = { tipo, lote, claveCompleta };
    
    let mensaje = '';
    if (tipo === 'all') {
        mensaje = '¿Está seguro de que desea eliminar TODOS los datos del inventario?\n\nEsta acción no se puede deshacer.';
    } else if (tipo === 'lote') {
        mensaje = `¿Está seguro de que desea eliminar el lote "${lote}" y todas sus parcelas?\n\nEsta acción no se puede deshacer.`;
    } else if (tipo === 'parcela') {
        const parcela = inventario[lote].parcelas[claveCompleta];
        mensaje = `¿Está seguro de que desea eliminar la parcela ${parcela.numero} del lote "${lote}"?\n\nEsta acción no se puede deshacer.`;
    }
    
    elements.deleteMessage.textContent = mensaje;
    elements.deleteModal.classList.remove('hidden');
}

function ejecutarEliminacion() {
    if (!deleteTarget) return;
    
    const { tipo, lote, claveCompleta } = deleteTarget;
    
    try {
        if (tipo === 'all') {
            inventario = {};
            // Limpiar también la sesión actual
            loteActual = '';
            parcelaActual = '';
            medicionesActuales = [];
            parcelaEditandoKey = null;
            elements.loteInput.value = '';
            elements.parcelaInput.value = '';
            elements.editParcelaBtn.classList.add('hidden');
            actualizarSeccionCaptura();
            actualizarListaMediciones();
            actualizarBotones();
            alert('✅ Todos los datos han sido eliminados');
        } else if (tipo === 'lote') {
            delete inventario[lote];
            alert(`✅ Lote "${lote}" eliminado exitosamente`);
        } else if (tipo === 'parcela') {
            delete inventario[lote].parcelas[claveCompleta];
            // Si era la última parcela del lote, eliminar el lote también
            if (Object.keys(inventario[lote].parcelas).length === 0) {
                delete inventario[lote];
            }
            alert('✅ Parcela eliminada exitosamente');
        }
        
        // Guardar cambios
        saveData();
        actualizarVisualizacionDatos();
        actualizarEstadisticasGlobales();
        
        // Respaldo automático después de eliminación
        if (Object.keys(inventario).length > 0) {
            backupToDevice();
        }
        
    } catch (error) {
        console.error('Error al eliminar:', error);
        alert('❌ Error al eliminar. Intente nuevamente.');
    }
    
    cerrarModalEliminacion();
}

function cerrarModalEliminacion() {
    elements.deleteModal.classList.add('hidden');
    deleteTarget = null;
}

function exportarInventarioCompleto() {
    if (Object.keys(inventario).length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    const incluirEstadisticas = elements.incluirEstadisticas.checked;
    const incluirFechaExport = elements.incluirFechaExport.checked;
    const fechaExport = obtenerFechaActual();
    const horaExport = new Date().toLocaleTimeString();
    
    // Headers básicos
    let headers = ['Lote', 'Parcela', 'Fecha_Medicion', 'Numero_Arbol', 'DAP_cm', 'CAP_cm'];
    
    if (incluirEstadisticas) {
        headers.push('Densidad_ha', 'DAP_Promedio_Parcela', 'Total_Arboles_Parcela');
    }
    
    if (incluirFechaExport) {
        headers.push('Fecha_Exportacion', 'Hora_Exportacion');
    }
    
    let csvContent = headers.join(',') + '\n';
    
    // Datos
    Object.entries(inventario).forEach(([nombreLote, datosLote]) => {
        if (datosLote.parcelas) {
            Object.values(datosLote.parcelas).forEach(parcela => {
                parcela.mediciones.forEach(medicion => {
                    let row = [
                        nombreLote,
                        parcela.numero,
                        parcela.fecha,
                        medicion.numeroArbol,
                        medicion.dap,
                        medicion.cap
                    ];
                    
                    if (incluirEstadisticas) {
                        row.push(
                            parcela.densidadHa,
                            parcela.dapPromedio.toFixed(2),
                            parcela.totalArboles
                        );
                    }
                    
                    if (incluirFechaExport) {
                        row.push(fechaExport, horaExport);
                    }
                    
                    csvContent += row.join(',') + '\n';
                });
            });
        }
    });
    
    const stats = calcularEstadisticasGlobales();
    const fileName = `InventarioForestal_Completo_${stats.totalLotes}L_${stats.totalParcelas}P_${stats.totalArboles}A_${fechaExport}.csv`;
    
    descargarArchivo(csvContent, fileName, 'text/csv');
    alert(`✅ Exportación completada:\n\n📊 ${stats.totalLotes} lotes\n📋 ${stats.totalParcelas} parcelas\n🌲 ${stats.totalArboles} árboles\n\n📁 Archivo: ${fileName}`);
}

function exportarEstadisticas() {
    if (Object.keys(inventario).length === 0) {
        alert('No hay datos para generar estadísticas');
        return;
    }
    
    const fechaExport = obtenerFechaActual();
    let csvContent = 'Lote,Parcela,Fecha_Medicion,Total_Arboles,DAP_Promedio,DAP_Minimo,DAP_Maximo,Densidad_ha,CAP_Promedio\n';
    
    Object.entries(inventario).forEach(([nombreLote, datosLote]) => {
        if (datosLote.parcelas) {
            Object.values(datosLote.parcelas).forEach(parcela => {
                const daps = parcela.mediciones.map(m => m.dap);
                const caps = parcela.mediciones.map(m => m.cap);
                const dapMin = Math.min(...daps);
                const dapMax = Math.max(...daps);
                const capPromedio = caps.reduce((a, b) => a + b, 0) / caps.length;
                
                csvContent += [
                    nombreLote,
                    parcela.numero,
                    parcela.fecha,
                    parcela.totalArboles,
                    parcela.dapPromedio.toFixed(2),
                    dapMin.toFixed(1),
                    dapMax.toFixed(1),
                    parcela.densidadHa,
                    capPromedio.toFixed(1)
                ].join(',') + '\n';
            });
        }
    });
    
    const stats = calcularEstadisticasGlobales();
    const fileName = `EstadisticasForestales_${stats.totalLotes}L_${stats.totalParcelas}P_${fechaExport}.csv`;
    
    descargarArchivo(csvContent, fileName, 'text/csv');
    alert(`✅ Estadísticas exportadas:\n\n📊 Resumen por parcela generado\n📁 Archivo: ${fileName}`);
}

function exportarTodosDatos() {
    // Función legacy - ahora redirige a la nueva función
    exportarInventarioCompleto();
}

// Funciones de exportación por lote
function exportarLote(nombreLote) {
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

// Funciones de respaldo local

function descargarArchivo(contenido, nombreArchivo, tipoMIME) {
    const blob = new Blob([contenido], { type: `${tipoMIME};charset=utf-8;` });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

// Visualización de datos guardados
function actualizarVisualizacionDatos() {
    if (Object.keys(inventario).length === 0) {
        elements.datosGuardados.innerHTML = '<p class="text-gray-500 italic">No hay datos guardados aún</p>';
        return;
    }
    
    let html = '<div class="space-y-4">';
    
    Object.entries(inventario).forEach(([nombreLote, datosLote]) => {
        html += `
            <div class="border border-gray-200 rounded-lg p-4 fade-in">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                    <h4 class="font-semibold text-gray-800">Lote: ${nombreLote}</h4>
                    <div class="flex gap-2">
                        <button onclick="exportarLote('${nombreLote}')" class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1">
                            <i data-lucide="download"></i>
                            CSV
                        </button>
                        <button onclick="confirmarEliminacion('lote', '${nombreLote}')" class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center gap-1">
                            <i data-lucide="trash-2"></i>
                            Eliminar
                        </button>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        `;
        
        if (datosLote.parcelas) {
            Object.entries(datosLote.parcelas).forEach(([claveCompleta, parcela]) => {
                html += `
                    <div class="bg-gray-50 p-3 rounded text-sm parcela-card">
                        <div class="parcela-actions">
                            <button class="btn-edit-parcela" onclick="editarParcelaGuardada('${nombreLote}', '${claveCompleta}')" title="Editar parcela">
                                <i data-lucide="edit-3"></i>
                            </button>
                            <button class="btn-delete-parcela" onclick="confirmarEliminacion('parcela', '${nombreLote}', '${claveCompleta}')" title="Eliminar parcela">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                        <p class="font-medium mb-2">Parcela ${parcela.numero}</p>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <div class="stat-label">Fecha</div>
                                <div class="stat-value">${parcela.fecha}</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Árboles</div>
                                <div class="stat-value">${parcela.totalArboles}</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">DAP promedio</div>
                                <div class="stat-value">${parcela.dapPromedio.toFixed(2)} cm</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Densidad</div>
                                <div class="stat-value">${parcela.densidadHa} /ha</div>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    elements.datosGuardados.innerHTML = html;
    
    // Reinicializar iconos
    if (window.lucide) {
        lucide.createIcons();
    }
}

// PWA Functions
async function instalarPWA() {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        console.log('PWA instalada');
    }
    
    deferredPrompt = null;
    elements.installButton.classList.add('hidden');
}

// Persistencia de datos
function saveData() {
    try {
        localStorage.setItem('inventarioForestal', JSON.stringify(inventario));
    } catch (e) {
        console.error('Error guardando datos:', e);
    }
}

function loadData() {
    try {
        const datos = localStorage.getItem('inventarioForestal');
        if (datos) {
            inventario = JSON.parse(datos);
            actualizarVisualizacionDatos();
            actualizarEstadisticasGlobales();
        }
    } catch (e) {
        console.error('Error cargando datos:', e);
    }
}

// Detector de conexión
window.addEventListener('online', () => {
    console.log('Conexión restaurada');
});

window.addEventListener('offline', () => {
    console.log('Sin conexión');
});