/**
 * ASIC Miranda - Pacientes Management Controller
 * Handles CRUD operations, interactive table/card views, real-time filtering & exports.
 */

let todosLosPacientes = [];
let pacientesFiltrados = [];
let currentView = 'table';
let pacienteAEliminar = null;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar fecha actual en el formulario de registro
    const regFecha = document.getElementById('reg-fecha');
    if (regFecha) {
        regFecha.value = new Date().toISOString().slice(0, 10);
    }

    // Comprobar si se solicitó abrir registro desde URL (ej: /pacientes?action=new)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
        abrirModalRegistro();
    }

    // Cargar pacientes
    cargarPacientes();
});

function getAuthHeaders(custom = {}) {
    const token = localStorage.getItem('asic_token');
    const headers = { ...custom };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

// Cargar pacientes desde la API
async function cargarPacientes() {
    try {
        const res = await fetch('/api/pacientes', { headers: getAuthHeaders() });
        if (res.status === 401) {
            window.location.href = '/login';
            return;
        }
        const data = await res.json();

        if (data.success) {
            todosLosPacientes = data.pacientes || [];
            filtrarPacientes();
        } else {
            showToast('error', 'Error', data.error || 'No se pudieron obtener los pacientes.');
        }
    } catch (err) {
        console.error('Error al cargar pacientes:', err);
        showToast('error', 'Conexión Fallida', 'No se pudo comunicar con el servidor.');
    }
}

// Filtrar pacientes en tiempo real
function filtrarPacientes() {
    const input = document.getElementById('input-search-pacientes');
    const term = (input ? input.value : '').toLowerCase().trim();

    if (!term) {
        pacientesFiltrados = [...todosLosPacientes];
    } else {
        pacientesFiltrados = todosLosPacientes.filter(p =>
            (p.nombre && p.nombre.toLowerCase().includes(term)) ||
            (p.apellido && p.apellido.toLowerCase().includes(term)) ||
            (p.ci && String(p.ci).toLowerCase().includes(term)) ||
            (p.direccion && p.direccion.toLowerCase().includes(term)) ||
            (p.sintomas && p.sintomas.toLowerCase().includes(term))
        );
    }

    ordenarPacientes();
}

// Ordenar lista de pacientes
function ordenarPacientes() {
    const select = document.getElementById('select-ordenar');
    const valor = select ? select.value : 'fecha-desc';

    pacientesFiltrados.sort((a, b) => {
        switch (valor) {
            case 'fecha-desc':
                return (b.fecha || '').localeCompare(a.fecha || '');
            case 'fecha-asc':
                return (a.fecha || '').localeCompare(b.fecha || '');
            case 'nombre-asc':
                return (a.nombre || '').localeCompare(b.nombre || '');
            case 'nombre-desc':
                return (b.nombre || '').localeCompare(a.nombre || '');
            case 'ci-asc':
                return String(a.ci || '').localeCompare(String(b.ci || ''));
            default:
                return 0;
        }
    });

    actualizarContador();
    renderVista();
}

// Actualizar badge contador
function actualizarContador() {
    const badge = document.getElementById('badge-contador');
    if (!badge) return;
    badge.textContent = `${pacientesFiltrados.length} de ${todosLosPacientes.length} paciente(s)`;
}

// Cambiar entre vista Tabla y Tarjetas
function cambiarVista(tipo) {
    currentView = tipo;
    const btnTable = document.getElementById('btn-view-table');
    const btnCards = document.getElementById('btn-view-cards');
    const containerTable = document.getElementById('container-table-view');
    const containerCards = document.getElementById('container-cards-view');

    if (tipo === 'table') {
        btnTable.classList.add('active');
        btnCards.classList.remove('active');
        containerTable.style.display = 'block';
        containerCards.style.display = 'none';
    } else {
        btnCards.classList.add('active');
        btnTable.classList.remove('active');
        containerTable.style.display = 'none';
        containerCards.style.display = 'grid';
    }

    renderVista();
}

// Renderizar la vista activa
function renderVista() {
    const emptyState = document.getElementById('empty-state');
    const containerTable = document.getElementById('container-table-view');
    const containerCards = document.getElementById('container-cards-view');

    if (pacientesFiltrados.length === 0) {
        if (containerTable) containerTable.style.display = 'none';
        if (containerCards) containerCards.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    if (currentView === 'table') {
        if (containerTable) containerTable.style.display = 'block';
        if (containerCards) containerCards.style.display = 'none';
        renderTabla(pacientesFiltrados);
    } else {
        if (containerTable) containerTable.style.display = 'none';
        if (containerCards) containerCards.style.display = 'grid';
        renderTarjetas(pacientesFiltrados);
    }
}

// Renderizar tabla
function renderTabla(lista) {
    const tbody = document.getElementById('tbody-pacientes');
    if (!tbody) return;

    tbody.innerHTML = lista.map(p => `
        <tr>
            <td>
                <span class="ci-pill" title="Cédula de Identidad">${escapeHtml(p.ci)}</span>
            </td>
            <td>
                <div class="patient-name-cell">
                    <div class="avatar-initials">${getInitials(p.nombre, p.apellido)}</div>
                    <div>
                        <div style="font-weight: 700; color: var(--text-primary);">${escapeHtml(p.nombre)} ${escapeHtml(p.apellido)}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="symptoms-tag" title="${escapeHtml(p.sintomas)}">
                    ${escapeHtml(p.sintomas || 'Sin síntomas registrados')}
                </span>
            </td>
            <td>${escapeHtml(p.direccion || 'Sin registrar')}</td>
            <td>${formatDate(p.fecha)}</td>
            <td style="text-align: right;">
                <div class="actions-group" style="justify-content: flex-end;">
                    <button class="btn btn-sm btn-secondary" onclick="verFichaMedica('${escapeHtml(p.ci)}')" title="Ver Ficha Clínica">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        Ficha
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="abrirModalEdicion('${escapeHtml(p.ci)}')" title="Editar Datos">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="confirmarEliminacion('${escapeHtml(p.ci)}', '${escapeHtml(p.nombre)}', '${escapeHtml(p.apellido)}')" title="Eliminar Registro">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Renderizar cuadrícula de tarjetas
function renderTarjetas(lista) {
    const container = document.getElementById('container-cards-view');
    if (!container) return;

    container.innerHTML = lista.map(p => `
        <div class="patient-card">
            <div>
                <div class="patient-card-header">
                    <span class="ci-pill">${escapeHtml(p.ci)}</span>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${formatDate(p.fecha)}</span>
                </div>
                <div class="patient-card-title">${escapeHtml(p.nombre)} ${escapeHtml(p.apellido)}</div>
                
                <div class="patient-card-body">
                    <div class="patient-detail-row">
                        <span class="icon">📍</span>
                        <span>${escapeHtml(p.direccion || 'Sin dirección')}</span>
                    </div>
                    <div class="patient-detail-row">
                        <span class="icon">🩺</span>
                        <span style="color: #fbbf24;">${escapeHtml(p.sintomas || 'Sin síntomas')}</span>
                    </div>
                </div>
            </div>

            <div class="actions-group" style="margin-top: 1rem; border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
                <button class="btn btn-sm btn-secondary" style="flex: 1;" onclick="verFichaMedica('${escapeHtml(p.ci)}')">
                    Ficha
                </button>
                <button class="btn btn-sm btn-secondary" style="flex: 1;" onclick="abrirModalEdicion('${escapeHtml(p.ci)}')">
                    Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="confirmarEliminacion('${escapeHtml(p.ci)}', '${escapeHtml(p.nombre)}', '${escapeHtml(p.apellido)}')">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

// ==========================================================================
// REGISTRO DE PACIENTE
// ==========================================================================

function abrirModalRegistro() {
    const form = document.getElementById('form-registro');
    if (form) form.reset();
    const regFecha = document.getElementById('reg-fecha');
    if (regFecha) regFecha.value = new Date().toISOString().slice(0, 10);
    openModal('modal-registro');
    setTimeout(() => {
        const ciInput = document.getElementById('reg-ci');
        if (ciInput) ciInput.focus();
    }, 150);
}

async function guardarNuevoPaciente(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = document.getElementById('btn-submit-registro');

    const ci = form.ci.value.trim();
    const nombre = form.nombre.value.trim();
    const apellido = form.apellido.value.trim();
    const direccion = form.direccion.value.trim();
    const sintomas = form.sintomas.value.trim();
    const fecha = form.fecha.value.trim() || new Date().toISOString().slice(0, 10);

    if (!ci || !nombre || !apellido) {
        showToast('error', 'Campos Incompletos', 'Cédula, Nombre y Apellido son obligatorios.');
        return;
    }

    try {
        if (submitBtn) submitBtn.disabled = true;

        const res = await fetch('/api/pacientes', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ ci, nombre, apellido, direccion, sintomas, fecha })
        });

        if (res.status === 401) {
            window.location.href = '/login';
            return;
        }

        const data = await res.json();

        if (res.ok && data.success) {
            showToast('success', 'Registrado', data.message || 'Paciente registrado con éxito.');
            closeModal('modal-registro');
            await cargarPacientes();
        } else {
            showToast('error', 'No se pudo registrar', data.error || 'Error al guardar el paciente.');
        }
    } catch (err) {
        console.error('Error al guardar paciente:', err);
        showToast('error', 'Error', 'Ocurrió un error en la conexión.');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

// ==========================================================================
// EDICIÓN DE PACIENTE
// ==========================================================================

async function abrirModalEdicion(ci) {
    try {
        const paciente = await buscarPacientePorCedula(ci);
        if (!paciente) return;

        document.getElementById('edit-ci').value = paciente.ci;
        document.getElementById('edit-nombre').value = paciente.nombre || '';
        document.getElementById('edit-apellido').value = paciente.apellido || '';
        document.getElementById('edit-direccion').value = paciente.direccion || '';
        document.getElementById('edit-sintomas').value = paciente.sintomas || '';
        document.getElementById('edit-fecha').value = paciente.fecha || '';

        openModal('modal-edicion');
    } catch (err) {
        showToast('error', 'Error', 'No se pudo cargar la información para editar.');
    }
}

async function actualizarPaciente(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = document.getElementById('btn-submit-edicion');

    const ci = form.ci.value;
    const nombre = form.nombre.value.trim();
    const apellido = form.apellido.value.trim();
    const direccion = form.direccion.value.trim();
    const sintomas = form.sintomas.value.trim();
    const fecha = form.fecha.value.trim();

    try {
        if (submitBtn) submitBtn.disabled = true;

        const res = await fetch(`/api/pacientes/${encodeURIComponent(ci)}`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ nombre, apellido, direccion, sintomas, fecha })
        });

        if (res.status === 401) {
            window.location.href = '/login';
            return;
        }

        const data = await res.json();

        if (res.ok && data.success) {
            showToast('success', 'Actualizado', 'Los datos del paciente han sido actualizados.');
            closeModal('modal-edicion');
            await cargarPacientes();
        } else {
            showToast('error', 'Error al Actualizar', data.error || 'No se pudieron actualizar los datos.');
        }
    } catch (err) {
        showToast('error', 'Error', 'Falla de comunicación con el servidor.');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

// ==========================================================================
// ELIMINACIÓN DE PACIENTE
// ==========================================================================

function confirmarEliminacion(ci, nombre, apellido) {
    pacienteAEliminar = ci;
    const nombreElem = document.getElementById('eliminar-paciente-nombre');
    const ciElem = document.getElementById('eliminar-paciente-ci');

    if (nombreElem) nombreElem.textContent = `${nombre} ${apellido}`;
    if (ciElem) ciElem.textContent = `Cédula: ${ci}`;

    openModal('modal-eliminar');
}

async function ejecutarEliminacion() {
    if (!pacienteAEliminar) return;

    const btn = document.getElementById('btn-confirmar-eliminar');
    try {
        if (btn) btn.disabled = true;

        const res = await fetch(`/api/pacientes/${encodeURIComponent(pacienteAEliminar)}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (res.status === 401) {
            window.location.href = '/login';
            return;
        }

        const data = await res.json();

        if (res.ok && data.success) {
            showToast('success', 'Eliminado', data.message || 'Paciente eliminado satisfactoriamente.');
            closeModal('modal-eliminar');
            pacienteAEliminar = null;
            await cargarPacientes();
        } else {
            showToast('error', 'Error', data.error || 'No se pudo eliminar al paciente.');
        }
    } catch (err) {
        showToast('error', 'Error', 'Error al procesar la solicitud de eliminación.');
    } finally {
        if (btn) btn.disabled = false;
    }
}

// ==========================================================================
// FICHA MÉDICA CLÍNICA
// ==========================================================================

async function verFichaMedica(ci) {
    const paciente = await buscarPacientePorCedula(ci);
    if (!paciente) return;

    const content = document.getElementById('ficha-detalle-content');
    if (content) {
        content.innerHTML = `
            <div class="ficha-header">
                <div class="ficha-hospital-name">ASIC MIRANDA</div>
                <div class="ficha-subtitle">EXPEDIENTE Y CONTROL CLÍNICO DEL PACIENTE</div>
            </div>
            <div class="ficha-row">
                <span class="ficha-label">Nombre Completo:</span>
                <span class="ficha-value">${escapeHtml(paciente.nombre)} ${escapeHtml(paciente.apellido)}</span>
            </div>
            <div class="ficha-row">
                <span class="ficha-label">Cédula de Identidad:</span>
                <span class="ficha-value"><span class="ci-pill">${escapeHtml(paciente.ci)}</span></span>
            </div>
            <div class="ficha-row">
                <span class="ficha-label">Fecha de Admisión:</span>
                <span class="ficha-value">${formatDate(paciente.fecha)}</span>
            </div>
            <div class="ficha-row">
                <span class="ficha-label">Ciudad / Dirección:</span>
                <span class="ficha-value">${escapeHtml(paciente.direccion || 'Sin dirección registrada')}</span>
            </div>
            <div class="ficha-row" style="flex-direction: column; gap: 0.5rem; border-bottom: none; margin-top: 0.5rem;">
                <span class="ficha-label">Síntomas / Diagnóstico de Entrada:</span>
                <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); padding: 0.85rem; border-radius: var(--radius-sm); font-size: 0.92rem; color: var(--text-primary); line-height: 1.5;">
                    ${escapeHtml(paciente.sintomas || 'No se registraron síntomas específicos.')}
                </div>
            </div>
        `;
    }

    openModal('modal-ficha');
}

// ==========================================================================
// EXPORTACIÓN DE DATOS (CSV & JSON)
// ==========================================================================

function exportarPacientesJSON() {
    if (!todosLosPacientes || todosLosPacientes.length === 0) {
        showToast('error', 'Sin datos', 'No hay registros de pacientes para exportar.');
        return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ pacienteData: todosLosPacientes }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pacientes_asic_miranda_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('success', 'Descarga Iniciada', 'Archivo JSON generado exitosamente.');
}

function exportarPacientesCSV() {
    if (!todosLosPacientes || todosLosPacientes.length === 0) {
        showToast('error', 'Sin datos', 'No hay registros de pacientes para exportar.');
        return;
    }

    const headers = ["Cédula", "Nombre", "Apellido", "Dirección", "Síntomas", "Fecha"];
    const rows = todosLosPacientes.map(p => [
        `"${(p.ci || '').replace(/"/g, '""')}"`,
        `"${(p.nombre || '').replace(/"/g, '""')}"`,
        `"${(p.apellido || '').replace(/"/g, '""')}"`,
        `"${(p.direccion || '').replace(/"/g, '""')}"`,
        `"${(p.sintomas || '').replace(/"/g, '""')}"`,
        `"${(p.fecha || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pacientes_asic_miranda_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('success', 'Descarga Iniciada', 'Archivo CSV generado exitosamente.');
}
