// Estado de la aplicación
let inventarioData = {
    lote: '',
    parcela: '',
    fecha: '',
    arboles: []
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Establecer fecha actual
    const fechaInput = document.getElementById('fecha');
    const hoy = new Date().toISOString().split('T')[0];
    fechaInput.value = hoy;
    
    // Cargar datos guardados
    cargarDatosGuardados();
    
    // Event Listeners
    document.getElementById('btnAgregarArbol').addEventListener('click', agregarArbol);
    document.getElementById('btnExportar').addEventListener('click', exportarCSV);
    document.getElementById('btnLimpiar').addEventListener('click', limpiarTodo);
    
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
    
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registrado'))
            .catch(err => console.log('Error registrando Service Worker:', err));
    }
});

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
    
    // Agregar árbol al array
    const arbol = {
        numero: parseInt(numeroArbol),
        dap: parseFloat(dap),
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
    mostrarMensaje('Árbol agregado correctamente', 'success');
    
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
    
    // Generar HTML
    lista.innerHTML = inventarioData.arboles.map((arbol, index) => `
        <div class="tree-item">
            <div class="tree-info">
                <span><strong>Árbol #${arbol.numero}</strong></span>
                <span>DAP: <strong>${arbol.dap} cm</strong></span>
            </div>
            <button class="btn-delete" onclick="eliminarArbol(${index})">×</button>
        </div>
    `).join('');
    
    // Actualizar contador
    contador.textContent = inventarioData.arboles.length;
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
    
    // Generar CSV
    let csv = 'Lote,Parcela,Fecha,Numero_Arbol,DAP_cm\n';
    
    inventarioData.arboles.forEach(arbol => {
        csv += `${inventarioData.lote},${inventarioData.parcela},${inventarioData.fecha},${arbol.numero},${arbol.dap}\n`;
    });
    
    // Crear blob y descargar
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const fecha = new Date().toISOString().split('T')[0];
    const filename = `inventario_${inventarioData.lote}_P${inventarioData.parcela}_${fecha}.csv`;
    
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    mostrarMensaje('CSV exportado exitosamente', 'success');
}

// Función para limpiar todo
function limpiarTodo() {
    if (confirm('¿Está seguro de limpiar todos los datos? Esta acción no se puede deshacer.')) {
        // Limpiar datos
        inventarioData = {
            lote: '',
            parcela: '',
            fecha: new Date().toISOString().split('T')[0],
            arboles: []
        };
        
        // Limpiar campos
        document.getElementById('lote').value = '';
        document.getElementById('parcela').value = '';
        document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
        document.getElementById('numeroArbol').value = '1';
        document.getElementById('dap').value = '';
        
        // Actualizar vista
        actualizarListaArboles();
        
        // Limpiar localStorage
        localStorage.removeItem('inventarioForestal');
        
        mostrarMensaje('Todos los datos han sido eliminados', 'info');
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