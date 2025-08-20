// Variables globales
let inventario = {};
let medicionesActuales = [];
let loteActual = '';
let parcelaActual = '';
let deferredPrompt = null;
let parcelaEditandoKey = null;

// Google Drive API
let gapi = null;
let driveConnected = false;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const CLIENT_ID = 'TU_CLIENT_ID.apps.googleusercontent.com'; // Necesitarás configurar esto

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
    guardarBtn: document.getElementById('guardarBtn'),
    nuevaParcelaBtn: document.getElementById('nuevaParcelaBtn'),
    nuevoLoteBtn: document.getElementById('nuevoLoteBtn'),
    datosGuardados: document.getElementById('datosGuardados'),
    installButton: document.getElementById('installButton'),
    driveConnectBtn: document.getElementById('driveConnectBtn'),
    driveStatus: document.getElementById('driveStatus'),
    driveStatusText: document.getElementById('driveStatusText'),
    editParcelaModal: document.getElementById('editParcelaModal'),
    nuevoNumeroParcelaInput: document.getElementById('nuevoNumeroParcelaInput'),
    confirmarEditParcelaBtn: document.getElementById('confirmarEditParcelaBtn'),
    cancelarEditParcelaBtn: document.getElementById('cancelarEditParcelaBtn')
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupPWA();
    loadData();
    initializeGoogleDrive();
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
    
    // Mostrar status de Drive
    elements.driveStatus.classList.remove('hidden');
    updateDriveStatus('disconnected');
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
    
    // Google Drive
    elements.driveConnectBtn.addEventListener('click', connectToGoogleDrive);
    
    // Modal de edición
    elements.confirmarEditParcelaBtn.addEventListener('click', confirmarEdicionParcela);
    elements.cancelarEditParcelaBtn.addEventListener('click', cerrarModalEdicion);
    elements.editParcelaModal.addEventListener('click', (e) => {
        if (e.target === elements.editParcelaModal) {
            cerrarModalEdicion();
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

// Funciones de Google Drive
async function initializeGoogleDrive() {
    try {
        if (typeof gapi !== 'undefined') {
            await gapi.load('auth2', initAuth);
            await gapi.load('client', initClient);
        }
    } catch (error) {
        console.log('Google API no disponible, modo offline');
        updateDriveStatus('offline');
    }
}

async function initAuth() {
    try {
        await gapi.auth2.init({
            client_id: CLIENT_ID
        });
    } catch (error) {
        console.error('Error inicializando auth:', error);
    }
}

async function initClient() {
    try {
        await gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC]
        });
    } catch (error) {
        console.error('Error inicializando client:', error);
    }
}

async function connectToGoogleDrive() {
    try {
        updateDriveStatus('connecting');
        
        if (!gapi || !gapi.auth2) {
            throw new Error('Google API no disponible');
        }
        
        const authInstance = gapi.auth2.getAuthInstance();
        const user = await authInstance.signIn({
            scope: SCOPES
        });
        
        if (user.isSignedIn()) {
            driveConnected = true;
            updateDriveStatus('connected');
            
            // Realizar respaldo automático si hay datos
            if (Object.keys(inventario).length > 0) {
                await backupToGoogleDrive();
            }
            
            alert('✅ Conectado a Google Drive. Los datos se respaldarán automáticamente.');
        }
    } catch (error) {
        console.error('Error conectando a Drive:', error);
        updateDriveStatus('error');
        alert('❌ Error al conectar con Google Drive. Verifique su conexión a internet.');
    }
}

function updateDriveStatus(status) {
    const statusElement = elements.driveStatus;
    const textElement = elements.driveStatusText;
    const iconElement = statusElement.querySelector('i');
    
    // Remover clases anteriores
    statusElement.classList.remove('connected', 'syncing');
    
    switch (status) {
        case 'connected':
            statusElement.classList.add('connected');
            textElement.textContent = 'Drive conectado';
            iconElement.setAttribute('data-lucide', 'cloud-check');
            break;
        case 'syncing':
            statusElement.classList.add('syncing');
            textElement.textContent = 'Sincronizando...';
            iconElement.setAttribute('data-lucide', 'cloud-upload');
            break;
        case 'connecting':
            textElement.textContent = 'Conectando...';
            iconElement.setAttribute('data-lucide', 'cloud');
            break;
        case 'error':
            textElement.textContent = 'Error de conexión';
            iconElement.setAttribute('data-lucide', 'cloud-off');
            break;
        case 'offline':
            textElement.textContent = 'Modo offline';
            iconElement.setAttribute('data-lucide', 'wifi-off');
            break;
        default: // disconnected
            textElement.textContent = 'Sin conexión a Drive';
            iconElement.setAttribute('data-lucide', 'cloud-off');
    }
    
    // Reinicializar iconos
    if (window.lucide) {
        lucide.createIcons();
    }
}

async function backupToGoogleDrive() {
    if (!driveConnected || !gapi.client.drive) {
        return;
    }
    
    try {
        updateDriveStatus('syncing');
        
        const fechaBackup = obtenerFechaActual();
        const horaBackup = new Date().toLocaleTimeString();
        
        // Crear contenido de respaldo
        let backupContent = `RESPALDO INVENTARIO FORESTAL\\n`;
        backupContent += `Fecha: ${fechaBackup} ${horaBackup}\\n`;
        backupContent += `=====================================\\n\\n`;
        
        Object.entries(inventario).forEach(([nombreLote, datosLote]) => {
            backupContent += `LOTE: ${nombreLote}\\n`;
            backupContent += `----------------------------------------\\n`;
            
            if (datosLote.parcelas) {
                Object.values(datosLote.parcelas).forEach(parcela => {
                    backupContent += `Parcela: ${parcela.numero}\\n`;
                    backupContent += `Fecha: ${parcela.fecha}\\n`;
                    backupContent += `Árboles: ${parcela.totalArboles}\\n`;
                    backupContent += `DAP promedio: ${parcela.dapPromedio.toFixed(2)} cm\\n`;
                    backupContent += `Mediciones:\\n`;
                    parcela.mediciones.forEach(medicion => {
                        backupContent += `  Árbol ${medicion.numeroArbol}: ${medicion.dap} cm\\n`;
                    });
                    backupContent += `\\n`;
                });
            }
            backupContent += `========================================\\n\\n`;
        });
        
        // Subir archivo a Google Drive
        const fileName = `Inventario_Forestal_${fechaBackup}_${horaBackup.replace(/:/g, '-')}.txt`;
        
        const fileMetadata = {
            name: fileName,
            parents: [] // Se guardará en la raíz de Drive
        };
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(fileMetadata)], {type: 'application/json'}));
        form.append('file', new Blob([backupContent], {type: 'text/plain'}));
        
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({
                'Authorization': `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
            }),
            body: form
        });
        
        if (response.ok) {
            updateDriveStatus('connected');
            console.log('Respaldo exitoso a Google Drive:', fileName);
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
        
    } catch (error) {
        console.error('Error en respaldo a Drive:', error);
        updateDriveStatus('error');
        setTimeout(() => updateDriveStatus(driveConnected ? 'connected' : 'disconnected'), 3000);
    }
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
    
    // Guardar parcela
    inventario[loteActual].parcelas[claveUnica] = {
        numero: parcelaActual,
        fecha: fechaActual,
        mediciones: [...medicionesActuales],
        totalArboles: medicionesActuales.length,
        dapPromedio: daps.reduce((a, b) => a + b, 0) / daps.length
    };
    
    // Guardar en localStorage
    saveData();
    
    // Respaldo automático a Google Drive
    if (driveConnected) {
        backupToGoogleDrive();
    }
    
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
    const confirmar = confirm(`¿Desea editar la parcela ${parcela.numero} del lote ${lote}?\\n\\nLos datos actuales se cargarán para edición.`);
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
    
    alert(`📝 Parcela ${parcela.numero} cargada para edición.\\n\\nPuede modificar las mediciones y guardar los cambios.`);
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

// Funciones de exportación
function exportarLote(nombreLote) {
    const datosLote = inventario[nombreLote];
    if (!datosLote || !datosLote.parcelas) return;
    
    let csvContent = 'Lote,Parcela,Fecha,Numero_Arbol,DAP_cm\\n';
    
    Object.values(datosLote.parcelas).forEach(parcela => {
        parcela.mediciones.forEach(medicion => {
            csvContent += `${nombreLote},${parcela.numero},${parcela.fecha},${medicion.numeroArbol},${medicion.dap}\\n`;
        });
    });
    
    descargarArchivo(csvContent, `Inventario_${nombreLote}_${obtenerFechaActual()}.csv`, 'text/csv');
}

function exportarResumen(nombreLote) {
    const datosLote = inventario[nombreLote];
    if (!datosLote || !datosLote.parcelas) return;
    
    let txtContent = `RESUMEN INVENTARIO FORESTAL\\n`;
    txtContent += `Lote: ${nombreLote}\\n`;
    txtContent += `Fecha de exportación: ${obtenerFechaActual()}\\n`;
    txtContent += `=====================================\\n\\n`;
    
    Object.values(datosLote.parcelas).forEach(parcela => {
        txtContent += `Parcela: ${parcela.numero}\\n`;
        txtContent += `Fecha medición: ${parcela.fecha}\\n`;
        txtContent += `Total árboles: ${parcela.totalArboles}\\n`;
        txtContent += `DAP promedio: ${parcela.dapPromedio.toFixed(2)} cm\\n`;
        txtContent += `Mediciones:\\n`;
        parcela.mediciones.forEach(medicion => {
            txtContent += `  Árbol ${medicion.numeroArbol}: ${medicion.dap} cm\\n`;
        });
        txtContent += `-------------------------------------\\n`;
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
            Object.entries(datosLote.parcelas).forEach(([claveCompleta, parcela]) => {
                html += `
                    <div class="bg-gray-50 p-3 rounded text-sm parcela-card">
                        <div class="parcela-actions">
                            <button class="btn-edit-parcela" onclick="editarParcelaGuardada('${nombreLote}', '${claveCompleta}')" title="Editar parcela">
                                <i data-lucide="edit-3"></i>
                            </button>
                        </div>
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
    if (driveConnected) {
        updateDriveStatus('connected');
    }
});

window.addEventListener('offline', () => {
    console.log('Sin conexión');
    updateDriveStatus('offline');
});