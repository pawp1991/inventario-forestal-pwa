// Estado de la aplicación
let inventarioData = {
    lote: '',
    parcela: '',
    fecha: '',
    arboles: []
};

// Almacén de todas las parcelas guardadas
let parcelasGuardadas = [];

// Variable para PWA
let deferredPrompt;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Establecer fecha actual
    const fechaInput = document.getElementById('fecha');
    const hoy = new Date().toISOString().split('T')[0];
    fechaInput.value = hoy;
    
    // Cargar datos guardados
    cargarDatosGuardados();
    cargarParcelasGuardadas();
    
    // Event Listeners
    document.getElementById('btnAgregarArbol').addEventListener('click', agregarArbol);
    document.getElementById('btnGuardarParcela').addEventListener('click', guardarParcela);
    document.getElementById('btnExportar').addEventListener('click', exportarCSV);
    document.getElementById('btnExportarTodo').addEventListener('click', exportarTodasParcelas);
    document.getElementById('btnLimpiar').addEventListener('click', limpiarParcelaActual);
    document.getElementById('btnInstalar').addEventListener('click', instalarApp);
    
    // Auto-guardar cuando cambian los campos
    document.getElementById('lote').addEventListener('input', guardarDatos);
    document.getElementById('parcela').addEventListener('input', guardarDatos);
    document.getElementById('fecha').addEventListener('change', guardarDatos);
    
    // Enter en campo DAP agrega el árbol
    document.getElementById('dap').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            agregarArbol();
        }
    });
    
    // Auto-incrementar número de árbol
    actualizarNumeroArbol();
    actualizarContadorParcelas();
    
    // Capturar evento de instalación PWA
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        // Mostrar botón de instalación
        document.getElementById('btnInstalar').style.display = 'block';
    });
    
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => {
                console.log('Service Worker registrado');
                // Verificar actualizaciones
                reg.update();
            })
            .catch(err => console.log('Error registrando Service Worker:', err));
    }
});

// Función para instalar la app
function instalarApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('Usuario aceptó instalar');
                document.getElementById('btnInstalar').style.display = 'none';
            }
            deferredPrompt = null;
        });
    }
}

// Función para agregar árbol
function agregarArbol() {
    const numeroArbol = document.getElementById('numeroArbol').value;
    const dap = document.getElementById('dap').value;
    
    // Validación
    if (!numeroArbol || !dap) {
        mostrarMensaje('Por favor complete número de árbol y DAP', 'error');
        return;
    }
    
    if (parseFloat(dap) <= 0) {
        mostrarMensaje('El DAP debe ser mayor a 0', 'error');
        return;
    }
    
    // Calcular CAP = (ENTERO(DAP*π/5))*5
    const cap = Math.floor((parseFloat(dap) * Math.PI / 5)) * 5;
    
    // Agregar árbol al array
    const arbol = {
        numero: parseInt(numeroArbol),
        dap: parseFloat(dap),
        cap: cap,
        timestamp: new Date().toISOString()
    };
    
    inventarioData.arboles.push(arbol);
    
    // Limpiar campos
    document.getElementById('dap').value = '';
    
    // Auto-incrementar número
    actualizarNumeroArbol();
    
    // Actualizar vista
    actualizarListaArboles();
    
    // Guardar datos
    guardarDatos();
    
    // Feedback visual
    mostrarMensaje(`Árbol agregado: DAP=${dap}cm, CAP=${cap}cm`, 'success');
    
    // Focus en DAP para siguiente entrada
    document.getElementById('dap').focus();
}

// Función para actualizar lista de árboles
function actualizarListaArboles() {
    const lista = document.getElementById('listaArboles');
    const contador = document.getElementById('contadorArboles');
    
    if (inventarioData.arboles.length === 0) {
        lista.innerHTML = '<div class="empty-message">No hay árboles registrados aún</div>';
        contador.textContent = '0';
        return;
    }
    
    // Ordenar por número de árbol
    inventarioData.arboles.sort((a, b) => a.numero - b.numero);
    
    // Generar HTML con opción de editar
    lista.innerHTML = inventarioData.arboles.map((arbol, index) => `
        <div class="tree-item" id="tree-${index}">
            <div class="tree-info">
                <span><strong>Árbol #${arbol.numero}</strong></span>
                <span class="dap-display">DAP: <strong>${arbol.dap} cm</strong></span>
                <span class="cap-display">CAP: <strong>${arbol.cap} cm</strong></span>
            </div>
            <div class="tree-actions">
                <button class="btn-edit" onclick="editarArbol(${index})">✏️</button>
                <button class="btn-delete" onclick="eliminarArbol(${index})">×</button>
            </div>
        </div>
    `).join('');
    
    // Actualizar contador
    contador.textContent = inventarioData.arboles.length;
}

// Función para editar árbol
function editarArbol(index) {
    const arbol = inventarioData.arboles[index];
    const treeItem = document.getElementById(`tree-${index}`);
    
    // Cambiar a modo edición
    treeItem.innerHTML = `
        <div class="tree-info">
            <span><strong>Árbol #${arbol.numero}</strong></span>
            <span>DAP: <input type="number" id="edit-dap-${index}" value="${arbol.dap}" step="0.1" min="0"></span>
            <span>CAP: <strong id="cap-preview-${index}">${arbol.cap} cm</strong></span>
        </div>
        <div class="tree-actions">
            <button class="btn-save" onclick="guardarEdicion(${index})">✔️</button>
            <button class="btn-cancel" onclick="cancelarEdicion()">❌</button>
        </div>
    `;
    
    treeItem.classList.add('editing');
    
    // Actualizar CAP en tiempo real
    document.getElementById(`edit-dap-${index}`).addEventListener('input', function(e) {
        const newCap = Math.floor((parseFloat(e.target.value) * Math.PI / 5)) * 5;
        document.getElementById(`cap-preview-${index}`).textContent = `${newCap} cm`;
    });
}

// Función para guardar edición
function guardarEdicion(index) {
    const newDap = parseFloat(document.getElementById(`edit-dap-${index}`).value);
    
    if (newDap <= 0) {
        mostrarMensaje('El DAP debe ser mayor a 0', 'error');
        return;
    }
    
    // Actualizar valores
    inventarioData.arboles[index].dap = newDap;
    inventarioData.arboles[index].cap = Math.floor((newDap * Math.PI / 5)) * 5;
    
    // Actualizar vista
    actualizarListaArboles();
    guardarDatos();
    mostrarMensaje('Árbol actualizado correctamente', 'success');
}

// Función para cancelar edición
function cancelarEdicion() {
    actualizarListaArboles();
}

// Función para eliminar árbol
function eliminarArbol(index) {
    if (confirm('¿Eliminar este árbol?')) {
        inventarioData.arboles.splice(index, 1);
        actualizarListaArboles();
        guardarDatos();
        actualizarNumeroArbol();
        mostrarMensaje('Árbol eliminado', 'info');
    }
}

// Función para guardar parcela
function guardarParcela() {
    // Validar datos
    if (!inventarioData.lote || !inventarioData.parcela) {
        mostrarMensaje('Complete los datos de lote y parcela', 'error');
        return;
    }
    
    if (inventarioData.arboles.length === 0) {
        mostrarMensaje('Agregue al menos un árbol antes de guardar', 'error');
        return;
    }
    
    // Crear copia de la parcela actual
    const parcelaActual = {
        lote: inventarioData.lote,
        parcela: inventarioData.parcela,
        fecha: inventarioData.fecha,
        arboles: [...inventarioData.arboles],
        guardadoEn: new Date().toISOString()
    };
    
    // Agregar a parcelas guardadas
    parcelasGuardadas.push(parcelaActual);
    
    // Guardar en localStorage
    localStorage.setItem('parcelasGuardadas', JSON.stringify(parcelasGuardadas));
    
    // Limpiar para nueva parcela
    inventarioData.arboles = [];
    inventarioData.parcela = (parseInt(inventarioData.parcela) + 1).toString();
    document.getElementById('parcela').value = inventarioData.parcela;
    document.getElementById('numeroArbol').value = '1';
    document.getElementById('dap').value = '';
    
    // Actualizar vista
    actualizarListaArboles();
    actualizarContadorParcelas();
    guardarDatos();
    
    mostrarMensaje(`Parcela ${parcelaActual.parcela} guardada. Iniciando parcela ${inventarioData.parcela}`, 'success');
}

// Función para actualizar contador de parcelas
function actualizarContadorParcelas() {
    const contador = document.getElementById('parcelasGuardadas');
    if (parcelasGuardadas.length > 0) {
        contador.textContent = `📦 ${parcelasGuardadas.length} parcelas guardadas`;
    } else {
        contador.textContent = '';
    }
}

// Función para auto-incrementar número de árbol
function actualizarNumeroArbol() {
    const numeroArbolInput = document.getElementById('numeroArbol');
    if (inventarioData.arboles.length === 0) {
        numeroArbolInput.value = 1;
    } else {
        const maxNumero = Math.max(...inventarioData.arboles.map(a => a.numero));
        numeroArbolInput.value = maxNumero + 1;
    }
}

// Función para guardar datos
function guardarDatos() {
    inventarioData.lote = document.getElementById('lote').value;
    inventarioData.parcela = document.getElementById('parcela').value;
    inventarioData.fecha = document.getElementById('fecha').value;
    
    localStorage.setItem('inventarioForestal', JSON.stringify(inventarioData));
    
    // Actualizar indicador
    const estado = document.getElementById('estadoGuardado');
    estado.textContent = '✓ Datos guardados';
    estado.style.background = '#e8f5e9';
    
    setTimeout(() => {
        estado.textContent = 'Guardado automático activo';
    }, 2000);
}

// Función para cargar datos guardados
function cargarDatosGuardados() {
    const datosGuardados = localStorage.getItem('inventarioForestal');
    
    if (datosGuardados) {
        inventarioData = JSON.parse(datosGuardados);
        
        // Restaurar campos
        document.getElementById('lote').value = inventarioData.lote || '';
        document.getElementById('parcela').value = inventarioData.parcela || '';
        document.getElementById('fecha').value = inventarioData.fecha || new Date().toISOString().split('T')[0];
        
        // Actualizar lista
        actualizarListaArboles();
    }
}

// Función para cargar parcelas guardadas
function cargarParcelasGuardadas() {
    const parcelas = localStorage.getItem('parcelasGuardadas');
    if (parcelas) {
        parcelasGuardadas = JSON.parse(parcelas);
        actualizarContadorParcelas();
    }
}

// Función para exportar a CSV
function exportarCSV() {
    // Validar que hay datos
    if (!inventarioData.lote || !inventarioData.parcela) {
        mostrarMensaje('Complete los datos de lote y parcela', 'error');
        return;
    }
    
    if (inventarioData.arboles.length === 0) {
        mostrarMensaje('No hay árboles para exportar', 'error');
        return;
    }
    
    // Generar CSV con CAP
    let csv = 'Lote,Parcela,Fecha,Numero_Arbol,DAP_cm,CAP_cm\n';
    
    inventarioData.arboles.forEach(arbol => {
        csv += `${inventarioData.lote},${inventarioData.parcela},${inventarioData.fecha},${arbol.numero},${arbol.dap},${arbol.cap}\n`;
    });
    
    // Crear blob y descargar
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const fecha = new Date().toISOString().split('T')[0];
    const filename = `inventario_${inventarioData.lote}_P${inventarioData.parcela}_${fecha}.csv`;
    
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    mostrarMensaje('CSV exportado con columna CAP', 'success');
}

// Función para exportar todas las parcelas
function exportarTodasParcelas() {
    if (parcelasGuardadas.length === 0) {
        mostrarMensaje('No hay parcelas guardadas para exportar', 'error');
        return;
    }
    
    // Generar CSV con todas las parcelas
    let csv = 'Lote,Parcela,Fecha,Numero_Arbol,DAP_cm,CAP_cm\n';
    
    parcelasGuardadas.forEach(parcela => {
        parcela.arboles.forEach(arbol => {
            csv += `${parcela.lote},${parcela.parcela},${parcela.fecha},${arbol.numero},${arbol.dap},${arbol.cap}\n`;
        });
    });
    
    // Si hay datos en la parcela actual, incluirlos también
    if (inventarioData.arboles.length > 0 && inventarioData.lote && inventarioData.parcela) {
        inventarioData.arboles.forEach(arbol => {
            csv += `${inventarioData.lote},${inventarioData.parcela},${inventarioData.fecha},${arbol.numero},${arbol.dap},${arbol.cap}\n`;
        });
    }
    
    // Crear blob y descargar
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const fecha = new Date().toISOString().split('T')[0];
    const filename = `inventario_completo_${fecha}.csv`;
    
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    const totalParcelas = parcelasGuardadas.length + (inventarioData.arboles.length > 0 ? 1 : 0);
    mostrarMensaje(`Exportadas ${totalParcelas} parcelas con CAP`, 'success');
}

// Función para limpiar parcela actual
function limpiarParcelaActual() {
    if (confirm('¿Limpiar solo la parcela actual? Los datos de otras parcelas guardadas se mantendrán.')) {
        // Limpiar solo árboles de parcela actual
        inventarioData.arboles = [];
        
        // Limpiar campos de árbol
        document.getElementById('numeroArbol').value = '1';
        document.getElementById('dap').value = '';
        
        // Actualizar vista
        actualizarListaArboles();
        
        // Guardar estado
        guardarDatos();
        
        mostrarMensaje('Parcela actual limpiada', 'info');
    }
}

// Función para mostrar mensajes
function mostrarMensaje(mensaje, tipo) {
    // Crear elemento de mensaje
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 90%;
        text-align: center;
    `;
    
    // Color según tipo
    switch(tipo) {
        case 'success':
            msgDiv.style.background = '#4caf50';
            break;
        case 'error':
            msgDiv.style.background = '#f44336';
            break;
        case 'info':
            msgDiv.style.background = '#2196f3';
            break;
    }
    
    msgDiv.textContent = mensaje;
    document.body.appendChild(msgDiv);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        msgDiv.remove();
    }, 3000);
}
// ========= CÓDIGO DE DEBUG PARA INSTALACIÓN =========
// Agregar este código AL FINAL del archivo app.js

// Verificar si PWA es instalable
window.addEventListener('load', () => {
    // Mostrar estado de Service Worker
    if ('serviceWorker' in navigator) {
        console.log('✅ Service Worker soportado');
        
        navigator.serviceWorker.ready.then(() => {
            console.log('✅ Service Worker activo');
        });
    } else {
        console.log('❌ Service Worker NO soportado');
    }
    
    // Verificar HTTPS
    if (location.protocol === 'https:' || location.hostname === 'localhost') {
        console.log('✅ Sitio seguro (HTTPS)');
    } else {
        console.log('❌ Sitio NO seguro - PWA requiere HTTPS');
    }
    
    // Verificar manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
        console.log('✅ Manifest vinculado');
    } else {
        console.log('❌ Manifest NO encontrado');
    }
});

// Forzar mostrar botón de instalación después de 3 segundos
setTimeout(() => {
    const btnInstalar = document.getElementById('btnInstalar');
    if (btnInstalar && btnInstalar.style.display === 'none') {
        console.log('⚠️ Mostrando botón de instalación manualmente');
        btnInstalar.style.display = 'block';
        
        // Agregar funcionalidad manual si no hay prompt
        btnInstalar.addEventListener('click', () => {
            if (!deferredPrompt) {
                alert('Para instalar la app:\n\n1. Abre el menú del navegador (⋮)\n2. Busca "Agregar a pantalla de inicio"\n3. Confirma la instalación\n\nO en iOS:\n1. Toca el botón compartir\n2. "Agregar a pantalla de inicio"');
            }
        });
    }
}, 3000);

// Detectar si ya está instalada
window.addEventListener('appinstalled', () => {
    console.log('✅ App instalada exitosamente');
    const btnInstalar = document.getElementById('btnInstalar');
    if (btnInstalar) {
        btnInstalar.style.display = 'none';
    }
});

// Verificar si está en modo standalone (ya instalada)
if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('✅ App ejecutándose en modo standalone');
    const btnInstalar = document.getElementById('btnInstalar');
    if (btnInstalar) {
        btnInstalar.style.display = 'none';
    }
}

// Escuchar errores de instalación
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('✅ Evento beforeinstallprompt detectado');
});

console.log('🔍 Debug de instalación cargado - Revisa la consola para más información');
// Forzar prompt de instalación después de 5 segundos
setTimeout(() => {
    if (!window.matchMedia('(display-mode: standalone)').matches) {
        console.log('App no instalada, mostrando opciones...');
        // Mostrar instrucciones personalizadas
        if (confirm('¿Deseas instalar la aplicación para uso offline? \n\nPresiona OK para ver instrucciones')) {
            alert('Para instalar:\n1. Abre el menú del navegador (⋮)\n2. Selecciona "Agregar a pantalla de inicio"\n3. Confirma la instalación');
        }
    }
}, 5000);