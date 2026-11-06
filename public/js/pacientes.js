/**
 * ASIC Miranda - Pacientes Management Controller
 * Handles CRUD operations, Sector filters, search and full chronological history.
 */

let todosLosPacientes = [];
let pacientesFiltrados = [];
let pacienteAEliminar = null;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar fecha actual en el formulario de registro
    const regFecha = document.getElementById('reg-fecha');
    if (regFecha) {
        regFecha.value = getLocalDateISO();
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

    const selectSector = document.getElementById('select-filtro-sector');
    const sectorFiltro = selectSector ? selectSector.value : '';

    let filtrados = [...todosLosPacientes];

    if (sectorFiltro) {
        filtrados = filtrados.filter(p => (p.sector || '').toLowerCase() === sectorFiltro.toLowerCase());
    }

    if (term) {
        filtrados = filtrados.filter(p =>
            (p.nombre && p.nombre.toLowerCase().includes(term)) ||
            (p.apellido && p.apellido.toLowerCase().includes(term)) ||
            (p.ci && String(p.ci).toLowerCase().includes(term)) ||
            (p.sector && p.sector.toLowerCase().includes(term)) ||
            (p.direccion && p.direccion.toLowerCase().includes(term)) ||
            (p.ultimoDiagnostico && p.ultimoDiagnostico.toLowerCase().includes(term))
        );
    }

    pacientesFiltrados = filtrados;
    ordenarPacientes();
}

// Ordenar lista de pacientes
function ordenarPacientes() {
    const select = document.getElementById('select-ordenar');
    const valor = select ? select.value : 'fecha_registro-desc';

    pacientesFiltrados.sort((a, b) => {
        switch (valor) {
            case 'fecha_registro-desc':
                return (b.fecha_registro || '').localeCompare(a.fecha_registro || '');
            case 'nombre-asc':
                return (a.nombre || '').localeCompare(b.nombre || '');
            case 'ci-asc':
                return String(a.ci || '').localeCompare(String(b.ci || ''));
            case 'totalConsultas-desc':
                return (b.totalConsultas || 0) - (a.totalConsultas || 0);
            default:
                return 0;
        }
    });

    actualizarContador();
    renderVista();
}

function actualizarContador() {
    const badge = document.getElementById('badge-contador');
    if (!badge) return;
    const total = todosLosPacientes.length;
    const filtrados = pacientesFiltrados.length;
    badge.textContent = `${filtrados} de ${total} paciente${total === 1 ? '' : 's'}`;
}

// Renderizar tabla
function renderVista() {
    const tbody = document.getElementById('tbody-pacientes');
    const emptyState = document.getElementById('empty-state');

    if (!tbody) return;

    if (pacientesFiltrados.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = pacientesFiltrados.map(p => `
        <tr>
            <td><span class="ci-pill">${escapeHtml(p.ci)}</span></td>
            <td>
                <div class="patient-name-cell">
                    <div class="avatar-initials">${getInitials(p.nombre, p.apellido)}</div>
                    <div>
                        <div style="font-weight: 700; color: var(--text-primary);">${escapeHtml(p.nombre)} ${escapeHtml(p.apellido)}</div>
                        <div style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(p.direccion || 'Sin dirección')}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="status-badge" style="background: rgba(6, 182, 212, 0.12); color: var(--accent); border-color: rgba(6, 182, 212, 0.25);">
                    ${escapeHtml(p.sector || 'Casco Central')}
                </span>
            </td>
            <td>${escapeHtml(p.telefono || 'Sin teléfono')}</td>
            <td>
                <span class="status-badge" style="background: var(--bg-surface-elevated); font-weight: 700; color: var(--primary);">
                    ${p.totalConsultas || 0} visitas
                </span>
            </td>
            <td style="max-width: 200px;">
                <span style="font-size: 0.85rem; font-weight: 600; color: ${p.totalConsultas > 0 ? 'var(--text-primary)' : 'var(--text-muted)'};">
                    ${escapeHtml(p.ultimoDiagnostico || 'Sin consultas')}
                </span>
            </td>
            <td>${formatDate(p.fecha_registro)}</td>
            <td style="text-align: right;">
                <div style="display: inline-flex; gap: 0.35rem;">
                    <button class="btn btn-sm btn-secondary" onclick="verFicha('${escapeHtml(p.ci)}')" title="Ver Ficha e Historial Completo">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        Ficha
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="irAConsultasPaciente('${escapeHtml(p.ci)}')" title="Registrar Consulta Médica">
                        + Consulta
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="abrirModalEdicion('${escapeHtml(p.ci)}')" title="Modificar Datos">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                    <button class="btn btn-sm btn-danger" data-ci="${escapeHtml(p.ci)}" onclick="abrirModalEliminacion(this.dataset.ci)" title="Eliminar Paciente">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Redireccionar al panel para triaje y consulta de ese paciente
function irAConsultasPaciente(ci) {
    window.location.href = `/?ci=${encodeURIComponent(ci)}`;
}

// ==============================================================
// VER FICHA COMPLETA CON HISTORIAL CRONOLÓGICO DE VISITAS
// ==============================================================
async function verFicha(ci) {
    const paciente = await buscarPacientePorCedula(ci);
    if (!paciente) return;

    const cont = document.getElementById('ficha-detalle-content');
    if (!cont) return;

    const historial = paciente.historial || [];

    let visitasHtml = '';
    if (historial.length === 0) {
        visitasHtml = `
            <div style="background: var(--bg-surface-elevated); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md); padding: 1.5rem; text-align: center; color: var(--text-muted); margin-top: 1rem;">
                No registra atenciones médicas previas.
            </div>
        `;
    } else {
        visitasHtml = `
            <div style="margin-top: 1.5rem;">
                <h4 style="font-size: 1rem; color: var(--accent); margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.4rem;">
                    Historial de Visitas Médicas (${historial.length}) — Orden Cronológico
                </h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${historial.map((c, idx) => `
                        <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                                <div>
                                    <strong style="color: var(--text-primary);">Consulta #${historial.length - idx}</strong>
                                    <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 0.5rem;">📅 ${formatDate(c.fecha_consulta)}</span>
                                    <span class="status-badge" style="background: var(--bg-surface); font-size: 0.75rem; margin-left: 0.5rem;">Semana EP: ${c.semana_ep || '--'}</span>
                                </div>
                                <span style="background: rgba(37, 99, 235, 0.15); color: var(--primary); padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 700;">
                                    ${escapeHtml(c.diagnostico)}
                                </span>
                            </div>
                            <div style="font-size: 0.88rem; margin-top: 0.4rem;">
                                <div><strong style="color: var(--accent);">Síntomas:</strong> ${escapeHtml(c.sintomas)}</div>
                                <div style="margin-top: 0.2rem;"><strong style="color: var(--success);">Tratamiento:</strong> ${escapeHtml(c.tratamiento || 'Ninguno prescrito')}</div>
                                ${c.observaciones ? `<div style="margin-top: 0.2rem; color: var(--text-muted);"><em>Observaciones:</em> ${escapeHtml(c.observaciones)}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    cont.innerHTML = `
        <div>
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem;">
                <div class="avatar-initials" style="width: 50px; height: 50px; font-size: 1.25rem;">
                    ${getInitials(paciente.nombre, paciente.apellido)}
                </div>
                <div>
                    <h3 style="font-size: 1.25rem; color: var(--text-primary); margin-bottom: 0.2rem;">
                        ${escapeHtml(paciente.nombre)} ${escapeHtml(paciente.apellido)}
                    </h3>
                    <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                        <span class="ci-pill">${escapeHtml(paciente.ci)}</span>
                        <span class="status-badge" style="background: rgba(6, 182, 212, 0.12); color: var(--accent); border-color: var(--accent);">
                            📍 Sector: ${escapeHtml(paciente.sector || 'Casco Central')}
                        </span>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">
                            📞 ${escapeHtml(paciente.telefono || 'Sin teléfono')}
                        </span>
                    </div>
                </div>
            </div>

            <div style="background: var(--bg-surface-elevated); padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">
                <div><strong>Dirección:</strong> ${escapeHtml(paciente.direccion || 'No especificada')}</div>
                <div style="margin-top: 0.25rem;"><strong>Fecha de Registro en Sistema:</strong> ${formatDate(paciente.fecha_registro)}</div>
            </div>

            ${visitasHtml}
        </div>
    `;

    openModal('modal-ficha');
}

// ==============================================================
// MODAL: REGISTRAR PACIENTE
// ==============================================================
function abrirModalRegistro() {
    const form = document.getElementById('form-registro');
    if (form) form.reset();

    const regFecha = document.getElementById('reg-fecha');
    if (regFecha) regFecha.value = getLocalDateISO();

    openModal('modal-registro');
}

async function guardarNuevoPaciente(e) {
    e.preventDefault();

    const form = document.getElementById('form-registro');
    const formData = new FormData(form);

    const payload = {
        ci: formData.get('ci')?.trim(),
        nombre: formData.get('nombre')?.trim(),
        apellido: formData.get('apellido')?.trim(),
        telefono: formData.get('telefono')?.trim(),
        sector: formData.get('sector')?.trim(),
        direccion: formData.get('direccion')?.trim(),
        fecha_registro: formData.get('fecha_registro') || getLocalDateISO()
    };

    try {
        const res = await fetch('/api/pacientes', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.success) {
            showToast('success', 'Paciente Registrado', 'Expediente creado correctamente en el ASIC Miranda.');
            closeModal('modal-registro');
            cargarPacientes();
        } else {
            showToast('error', 'Error al guardar', data.error || 'No se pudo guardar el paciente.');
        }
    } catch (err) {
        showToast('error', 'Error de conexión', 'No se pudo comunicar con el servidor.');
    }
}

// ==============================================================
// MODAL: EDITAR PACIENTE
// ==============================================================
async function abrirModalEdicion(ci) {
    const paciente = todosLosPacientes.find(p => p.ci === ci);
    if (!paciente) return;

    document.getElementById('edit-ci').value = paciente.ci;
    document.getElementById('edit-nombre').value = paciente.nombre;
    document.getElementById('edit-apellido').value = paciente.apellido;
    document.getElementById('edit-telefono').value = paciente.telefono || '';

    const sectorSelect = document.getElementById('edit-sector');
    const sectorActual = paciente.sector || 'Casco Central';
    if (!Array.from(sectorSelect.options).some(opt => opt.value === sectorActual)) {
        sectorSelect.add(new Option(sectorActual, sectorActual));
    }
    sectorSelect.value = sectorActual;

    document.getElementById('edit-direccion').value = paciente.direccion || '';

    openModal('modal-edicion');
}

async function actualizarPaciente(e) {
    e.preventDefault();

    const form = document.getElementById('form-edicion');
    const formData = new FormData(form);
    const ci = formData.get('ci');

    const payload = {
        nombre: formData.get('nombre')?.trim(),
        apellido: formData.get('apellido')?.trim(),
        telefono: formData.get('telefono')?.trim(),
        sector: formData.get('sector')?.trim(),
        direccion: formData.get('direccion')?.trim()
    };

    try {
        const res = await fetch(`/api/pacientes/${encodeURIComponent(ci)}`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.success) {
            showToast('success', 'Datos Actualizados', 'Información del paciente modificada.');
            closeModal('modal-edicion');
            cargarPacientes();
        } else {
            showToast('error', 'Error al actualizar', data.error || 'No se pudo actualizar.');
        }
    } catch (err) {
        showToast('error', 'Error de conexión', 'No se pudo comunicar con el servidor.');
    }
}

// ==============================================================
// MODAL: ELIMINAR PACIENTE
// ==============================================================
function abrirModalEliminacion(ci) {
    const paciente = todosLosPacientes.find(p => p.ci === ci);
    const nombreCompleto = paciente ? `${paciente.nombre} ${paciente.apellido}` : ci;
    pacienteAEliminar = ci;
    document.getElementById('eliminar-paciente-nombre').textContent = nombreCompleto;
    document.getElementById('eliminar-paciente-ci').textContent = ci;
    openModal('modal-eliminar');
}

async function ejecutarEliminacion() {
    if (!pacienteAEliminar) return;

    try {
        const res = await fetch(`/api/pacientes/${encodeURIComponent(pacienteAEliminar)}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const data = await res.json();

        if (res.ok && data.success) {
            showToast('success', 'Registro Eliminado', 'El paciente y su historial médico fueron eliminados.');
            closeModal('modal-eliminar');
            pacienteAEliminar = null;
            cargarPacientes();
        } else {
            showToast('error', 'Error al eliminar', data.error || 'No se pudo eliminar el registro.');
        }
    } catch (err) {
        showToast('error', 'Error de conexión', 'No se pudo comunicar con el servidor.');
    }
}
