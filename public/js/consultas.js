/**
 * ASIC Miranda - Consultas Médicas & Semanas Epidemiológicas Controller
 */

let todasLasConsultas = [];

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar fecha en modal
    const modalFecha = document.getElementById('modal-cons-fecha');
    if (modalFecha) {
        modalFecha.value = getLocalDateISO();
        calcularSemanaEp(modalFecha.value);
    }

    cargarConsultas();
});

function getAuthHeaders(custom = {}) {
    const token = localStorage.getItem('asic_token');
    const headers = { ...custom };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

// Cargar consultas aplicando los filtros
async function cargarConsultas() {
    const desde = document.getElementById('filtro-desde')?.value || '';
    const hasta = document.getElementById('filtro-hasta')?.value || '';
    const semana = document.getElementById('filtro-semana')?.value || '';
    const diagnostico = document.getElementById('filtro-diagnostico')?.value || '';
    const sector = document.getElementById('filtro-sector')?.value || '';

    const params = new URLSearchParams();
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    if (semana) params.append('semana_ep', semana);
    if (diagnostico) params.append('diagnostico', diagnostico);
    if (sector) params.append('sector', sector);

    try {
        const res = await fetch(`/api/consultas?${params.toString()}`, { headers: getAuthHeaders() });
        if (res.status === 401) {
            window.location.href = '/login';
            return;
        }

        const data = await res.json();
        if (data.success) {
            todasLasConsultas = data.consultas || [];
            renderTablaConsultas(todasLasConsultas);
        } else {
            showToast('error', 'Error', data.error || 'No se pudieron cargar las consultas.');
        }
    } catch (err) {
        console.error('Error al cargar consultas:', err);
        showToast('error', 'Error de conexión', 'No se pudo conectar con el servidor.');
    }
}

// Filtros rápidos
function aplicarFiltroRapido(tipo) {
    const inputDesde = document.getElementById('filtro-desde');
    const inputHasta = document.getElementById('filtro-hasta');
    const inputSemana = document.getElementById('filtro-semana');

    const hoy = new Date();
    const hoyStr = getLocalDateISO(hoy);

    if (tipo === 'semana-actual') {
        // Lunes de la semana actual
        const dia = hoy.getDay();
        const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
        const lunes = new Date(hoy.setDate(diff));
        inputDesde.value = getLocalDateISO(lunes);
        inputHasta.value = hoyStr;
        if (inputSemana) inputSemana.value = '';
    } else if (tipo === 'mes-actual') {
        const primeroMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        inputDesde.value = getLocalDateISO(primeroMes);
        inputHasta.value = hoyStr;
        if (inputSemana) inputSemana.value = '';
    } else if (tipo === 'todos') {
        inputDesde.value = '';
        inputHasta.value = '';
        if (inputSemana) inputSemana.value = '';
        document.getElementById('filtro-diagnostico').value = '';
        document.getElementById('filtro-sector').value = '';
    }

    cargarConsultas();
}

function renderTablaConsultas(consultas) {
    const tbody = document.getElementById('tbody-consultas');
    const emptyState = document.getElementById('empty-state-consultas');
    const badge = document.getElementById('badge-contador-consultas');

    if (badge) {
        badge.textContent = `${consultas.length} atención${consultas.length === 1 ? '' : 'es'}`;
    }

    if (!tbody) return;

    if (!consultas || consultas.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = consultas.map(c => `
        <tr>
            <td><strong>${formatDate(c.fecha_consulta)}</strong></td>
            <td><span class="status-badge" style="background: var(--bg-surface-elevated); font-size: 0.75rem;">Sem ${c.semana_ep || '--'}</span></td>
            <td><span class="ci-pill">${escapeHtml(c.paciente_ci)}</span></td>
            <td><strong>${escapeHtml(c.paciente_nombre)} ${escapeHtml(c.paciente_apellido)}</strong></td>
            <td>
                <span class="status-badge" style="background: rgba(6, 182, 212, 0.1); color: var(--accent); border-color: rgba(6, 182, 212, 0.25);">
                    ${escapeHtml(c.paciente_sector || 'Casco Central')}
                </span>
            </td>
            <td style="max-width: 200px; font-size: 0.85rem;" title="${escapeHtml(c.sintomas)}">
                <span class="symptoms-tag">${escapeHtml(c.sintomas)}</span>
            </td>
            <td>
                <span style="font-weight: 700; color: var(--primary);">${escapeHtml(c.diagnostico)}</span>
            </td>
            <td style="font-size: 0.82rem; color: var(--text-secondary); max-width: 180px;">
                ${escapeHtml(c.tratamiento || 'Sin prescripción')}
            </td>
            <td style="text-align: right;">
                <div style="display: inline-flex; gap: 0.35rem;">
                    <button class="btn btn-sm btn-secondary" onclick="editarConsulta(${c.id})" title="Editar Consulta">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarConsulta(${c.id})" title="Eliminar Consulta">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ==============================================================
// MODAL: REGISTRAR / EDITAR CONSULTA
// ==============================================================
function abrirModalConsulta() {
    const form = document.getElementById('form-consulta');
    if (form) form.reset();

    document.getElementById('cons-id').value = '';
    document.getElementById('modal-consulta-title').querySelector('span').textContent = 'Registro de Consulta Médica';

    const fechaInput = document.getElementById('modal-cons-fecha');
    if (fechaInput) {
        fechaInput.value = getLocalDateISO();
        calcularSemanaEp(fechaInput.value);
    }

    const ciInput = document.getElementById('modal-cons-ci');
    if (ciInput) ciInput.readOnly = false;

    openModal('modal-consulta');
}

function calcularSemanaEp(fechaStr) {
    const input = document.getElementById('modal-cons-semana');
    if (!input || !fechaStr) return;

    const d = new Date(fechaStr + 'T00:00:00');
    if (isNaN(d.getTime())) return;

    const start = new Date(d.getFullYear(), 0, 1);
    const dayOfWeek = start.getDay();
    const diff = (d - start) + ((dayOfWeek > 3 ? dayOfWeek - 7 : dayOfWeek) * 86400000);
    const week = Math.ceil((diff / 604800000) + 1);
    input.value = Math.max(1, Math.min(53, week));
}

function seleccionarDiagRapido(valor) {
    const input = document.getElementById('modal-cons-diagnostico');
    if (!input) return;
    if (valor && valor !== 'OTRO') {
        input.value = valor;
    } else if (valor === 'OTRO') {
        input.value = '';
        input.focus();
    }
}

async function verificarPacienteEnModal(ci) {
    const hint = document.getElementById('modal-cons-ci-hint');
    if (!hint || !ci.trim()) return;

    try {
        const res = await fetch(`/api/pacientes/${encodeURIComponent(ci.trim())}`, { headers: getAuthHeaders() });
        const data = await res.json();

        if (data.success && data.paciente) {
            hint.textContent = `✓ ${data.paciente.nombre} ${data.paciente.apellido} (${data.paciente.sector})`;
            hint.style.color = 'var(--success)';
        } else {
            hint.textContent = `⚠️ No encontrado. Debe registrar al paciente primero.`;
            hint.style.color = 'var(--danger)';
        }
    } catch (e) {
        hint.textContent = 'Error al verificar cédula.';
    }
}

async function guardarConsulta(e) {
    e.preventDefault();

    const form = document.getElementById('form-consulta');
    const formData = new FormData(form);
    const id = formData.get('id');

    const payload = {
        paciente_ci: formData.get('paciente_ci')?.trim(),
        fecha_consulta: formData.get('fecha_consulta'),
        semana_ep: formData.get('semana_ep'),
        sintomas: formData.get('sintomas')?.trim(),
        diagnostico: formData.get('diagnostico')?.trim(),
        tratamiento: formData.get('tratamiento')?.trim(),
        observaciones: formData.get('observaciones')?.trim()
    };

    const url = id ? `/api/consultas/${id}` : '/api/consultas';
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.success) {
            showToast('success', 'Consulta Guardada', 'La atención médica fue registrada correctamente.');
            closeModal('modal-consulta');
            cargarConsultas();
        } else {
            showToast('error', 'Error', data.error || 'No se pudo guardar la consulta.');
        }
    } catch (err) {
        showToast('error', 'Error de conexión', 'No se pudo comunicar con el servidor.');
    }
}

async function editarConsulta(id) {
    try {
        const res = await fetch(`/api/consultas/${id}`, { headers: getAuthHeaders() });
        const data = await res.json();

        if (!data.success || !data.consulta) {
            showToast('error', 'Error', 'No se encontró la consulta.');
            return;
        }

        const c = data.consulta;
        document.getElementById('cons-id').value = c.id;
        document.getElementById('modal-cons-ci').value = c.paciente_ci;
        document.getElementById('modal-cons-ci').readOnly = true;
        document.getElementById('modal-cons-fecha').value = c.fecha_consulta;
        document.getElementById('modal-cons-semana').value = c.semana_ep || '';
        document.getElementById('modal-cons-sintomas').value = c.sintomas || '';
        document.getElementById('modal-cons-diagnostico').value = c.diagnostico || '';
        document.getElementById('modal-cons-tratamiento').value = c.tratamiento || '';
        document.getElementById('modal-cons-observaciones').value = c.observaciones || '';

        document.getElementById('modal-consulta-title').querySelector('span').textContent = `Modificar Consulta #${c.id}`;
        openModal('modal-consulta');
    } catch (e) {
        showToast('error', 'Error', 'No se pudo cargar la consulta para edición.');
    }
}

async function eliminarConsulta(id) {
    if (!confirm(`¿Estás seguro de que deseas eliminar esta consulta médica del historial?`)) {
        return;
    }

    try {
        const res = await fetch(`/api/consultas/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const data = await res.json();
        if (res.ok && data.success) {
            showToast('success', 'Consulta Eliminada', 'La consulta fue borrada del expediente.');
            cargarConsultas();
        } else {
            showToast('error', 'Error', data.error || 'No se pudo eliminar la consulta.');
        }
    } catch (err) {
        showToast('error', 'Error', 'No se pudo comunicar con el servidor.');
    }
}

function imprimirListadoConsultas() {
    window.print();
}
