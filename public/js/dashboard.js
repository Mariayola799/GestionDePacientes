/**
 * ASIC Miranda - Dashboard Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        const token = localStorage.getItem('asic_token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Cargar estadísticas
        const statsRes = await fetch('/api/stats', { headers });
        if (statsRes.status === 401) {
            window.location.href = '/login';
            return;
        }
        const statsData = await statsRes.json();

        if (statsData.success) {
            document.getElementById('val-total-pacientes').textContent = statsData.totalPacientes ?? 0;
            document.getElementById('val-ingresos-hoy').textContent = statsData.ingresosHoy ?? 0;
        }

        // Cargar lista para tabla de recientes
        const pacRes = await fetch('/api/pacientes', { headers });
        if (pacRes.status === 401) {
            window.location.href = '/login';
            return;
        }
        const pacData = await pacRes.json();

        if (pacData.success) {
            renderTablaRecientes(pacData.pacientes.slice(-5).reverse());
        }
    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        showToast('error', 'Error de Carga', 'No se pudieron sincronizar los datos del servidor.');
    }
}

function renderTablaRecientes(pacientes) {
    const tbody = document.getElementById('tbody-recientes');
    if (!tbody) return;

    if (!pacientes || pacientes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                    No hay pacientes registrados en el sistema actualmente.<br>
                    <a href="/pacientes?action=new" class="btn btn-sm btn-primary" style="margin-top: 0.75rem;">Registrar primer paciente</a>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pacientes.map(p => `
        <tr>
            <td><span class="ci-pill">${escapeHtml(p.ci)}</span></td>
            <td>
                <div class="patient-name-cell">
                    <div class="avatar-initials">${getInitials(p.nombre, p.apellido)}</div>
                    <div>${escapeHtml(p.nombre)} ${escapeHtml(p.apellido)}</div>
                </div>
            </td>
            <td><span class="symptoms-tag" title="${escapeHtml(p.sintomas)}">${escapeHtml(p.sintomas || 'Sin síntomas registrados')}</span></td>
            <td>${escapeHtml(p.direccion || 'No especificada')}</td>
            <td>${formatDate(p.fecha)}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="verFicha('${escapeHtml(p.ci)}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    Ficha
                </button>
            </td>
        </tr>
    `).join('');
}

async function handleQuickSearch(e) {
    e.preventDefault();
    const ciInput = document.getElementById('input-quick-ci');
    if (!ciInput) return;

    const ci = ciInput.value.trim();
    if (!ci) {
        showToast('error', 'Cédula Requerida', 'Por favor ingresa una cédula para consultar.');
        return;
    }

    const paciente = await buscarPacientePorCedula(ci);
    if (paciente) {
        renderFichaContenido(paciente);
        openModal('modal-ficha-rapida');
    }
}

async function verFicha(ci) {
    const paciente = await buscarPacientePorCedula(ci);
    if (paciente) {
        renderFichaContenido(paciente);
        openModal('modal-ficha-rapida');
    }
}

function renderFichaContenido(p) {
    const container = document.getElementById('ficha-rapida-content');
    if (!container) return;

    container.innerHTML = `
        <div class="ficha-header">
            <div class="ficha-hospital-name">ASIC MIRANDA</div>
            <div class="ficha-subtitle">EXPEDIENTE CLÍNICO DE ADMISIÓN</div>
        </div>
        <div class="ficha-row">
            <span class="ficha-label">Nombre y Apellido:</span>
            <span class="ficha-value">${escapeHtml(p.nombre)} ${escapeHtml(p.apellido)}</span>
        </div>
        <div class="ficha-row">
            <span class="ficha-label">Cédula de Identidad:</span>
            <span class="ficha-value"><span class="ci-pill">${escapeHtml(p.ci)}</span></span>
        </div>
        <div class="ficha-row">
            <span class="ficha-label">Fecha de Ingreso:</span>
            <span class="ficha-value">${formatDate(p.fecha)}</span>
        </div>
        <div class="ficha-row">
            <span class="ficha-label">Dirección:</span>
            <span class="ficha-value">${escapeHtml(p.direccion || 'Sin dirección registrada')}</span>
        </div>
        <div class="ficha-row" style="flex-direction: column; gap: 0.4rem; border-bottom: none;">
            <span class="ficha-label">Síntomas y Motivo de Consulta:</span>
            <div style="background: var(--bg-surface); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); color: var(--text-primary); font-size: 0.9rem;">
                ${escapeHtml(p.sintomas || 'No se registraron síntomas')}
            </div>
        </div>
    `;
}
