// Variables globales
let inventario = {};
let medicionesActuales = [];
let loteActual = '';
let parcelaActual = '';
let deferredPrompt = null;

// DOM Elements
const elements = {
    loteInput: document.getElementById('loteInput'),
    parcelaInput: document.getElementById('parcelaInput'),
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
    guardarBtn: document.getElementById('guardarBtn'),
    nuevaParcelaBtn: document.getElementById('nuevaParcelaBtn'),
    nuevoLoteBtn: document.getElementById('nuevoLoteBtn'),
    datosGuardados: document.getElementById('datosGuardados'),
    installButton: document.getElementById('installButton')
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
}

function setupEventListeners() {
    // Inputs principales
    elements.loteInput.addEventListener('input', handleLoteChange);
    elements.parcelaInput.addEventListener('input', handleParcelaChange);
    
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
}

function actualizarSeccionCaptura() {
    if (loteActual && parcelaActual) {
        elements.capturaSection.classList.remove('hidden');
        elements.capturaTitle.textContent = `Mediciones DAP - Lote: ${loteActual}, Parcela: ${parcelaActual}`;
    } else {
        elements.capturaSection.classList.add('hidden');
    }
}

function handleEnterKey(e) {
    if (e.key === 'Enter') {
        agregarMedicion();
    }
}

// Funciones principales
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
    
    // Agregar medición
    medicionesActuales.push({ numeroArbol: numArbol, dap: dap });
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
            <span class="texto">Árbol ${medicion.numeroArbol}: ${medicion.dap} cm</span>
            <div class="botones">
                <button class="btn-editar" onclick="editarMedicion(${medicion.numeroArbol})" title="Editar">
                    <i data-lucide="edit-3"></i>
                </button>
                <button class="btn-eliminar" onclick="eliminarMedicion(${medicion.numeroArbol})" title="Eliminar">
                    <i data-lucide="x"></i>
                </button>
            </div>
        `;
        elements.medicionesGrid.appendChild(div);
    });
    
    // Calcular y mostrar promedio
    const promedio = medicionesActuales.reduce((sum, m) => sum + m.dap, 0) / medicionesActuales.length;
    elements.promedioDisplay.textContent = `Promedio: ${promedio.toFixed(2)} cm`;
    
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
    const claveUnica = `${fechaActual}_${Date.now()}`;
    const daps = medicionesActuales.map(m => m.dap);
    
    // Inicializar lote si no existe
    if (!inventario[loteActual]) {
        inventario[loteActual] = { parcelas: {} };
    }
    
    // Guardar parcela
    inventario[loteActual].parcelas[`${parcelaActual}_${claveUnica}`] = {
        numero: parcelaActual,
        fecha: fechaActual,
        mediciones: [...medicionesActuales],
        totalArboles: medicionesActuales.length,
        dapPromedio: daps.reduce((a, b) => a + b, 0) / daps.length
    };
    
    // Guardar en localStorage
    saveData();
    
    // Limpiar mediciones actuales
    medicionesActuales = [];
    actualizarListaMediciones();
    actualizarBotones();
    actualizarVisualizacionDatos();
    
    alert(`Parcela ${parcelaActual} del lote ${loteActual} guardada exitosamente`);
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
    elements.numeroArbolInput.value = '';
    elements.dapInput.value = '';
    
    actualizarListaMediciones();
    actualizarBotones();
    actualizarSeccionCaptura();
    
    // Focus en lote
    elements.loteInput.focus();
}

// Funciones de exportación
function exportarLote(nombreLote) {
    const datosLote = inventario[nombreLote];
    if (!datosLote || !datosLote.parcelas) return;
    
    let csvContent = 'Lote,Parcela,Fecha,Numero_Arbol,DAP_cm\n';
    
    Object.values(datosLote.parcelas).forEach(parcela => {
        parcela.mediciones.forEach(medicion => {
            csvContent += `${nombreLote},${parcela.numero},${parcela.fecha},${medicion.numeroArbol},${medicion.dap}\n`;
        });
    });
    
    descargarArchivo(csvContent, `Inventario_${nombreLote}_${obtenerFechaActual()}.csv`, 'text/csv');
}

function exportarResumen(nombreLote) {
    const datosLote = inventario[nombreLote];
    if (!datosLote || !datosLote.parcelas) return;
    
    let txtContent = `RESUMEN INVENTARIO FORESTAL\n`;
    txtContent += `Lote: ${nombreLote}\n`;
    txtContent += `Fecha de exportación: ${obtenerFechaActual()}\n`;
    txtContent += `=====================================\n\n`;
    
    Object.values(datosLote.parcelas).forEach(parcela => {
        txtContent += `Parcela: ${parcela.numero}\n`;
        txtContent += `Fecha medición: ${parcela.fecha}\n`;
        txtContent += `Total árboles: ${parcela.totalArboles}\n`;
        txtContent += `DAP promedio: ${parcela.dapPromedio.toFixed(2)} cm\n`;
        txtContent += `Mediciones:\n`;
        parcela.mediciones.forEach(medicion => {
            txtContent += `  Árbol ${medicion.numeroArbol}: ${medicion.dap} cm\n`;
        });
        txtContent += `-------------------------------------\n`;
    });
    
    descargarArchivo(txtContent, `Resumen_${nombreLote}_${obtenerFechaActual()}.txt`, 'text/plain');
}

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
                        <button onclick="exportarResumen('${nombreLote}')" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1">
                            <i data-lucide="file-text"></i>
                            TXT
                        </button>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        `;
        
        if (datosLote.parcelas) {
            Object.values(datosLote.parcelas).forEach(parcela => {
                html += `
                    <div class="bg-gray-50 p-3 rounded text-sm">
                        <p class="font-medium">Parcela ${parcela.numero}</p>
                        <p class="text-gray-600">Fecha: ${parcela.fecha}</p>
                        <p class="text-gray-600">Árboles: ${parcela.totalArboles}</p>
                        <p class="text-gray-600">DAP promedio: ${parcela.dapPromedio.toFixed(2)} cm</p>
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