/**
 * ASIC Miranda - Reportes de Morbilidad & Consolidado Epidemiológico Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar fecha de emisión
    const fechaEmision = document.getElementById('print-fecha-emision');
    if (fechaEmision) {
        const now = new Date();
        fechaEmision.textContent = `Fecha de Emisión Oficial: ${now.toLocaleDateString('es-VE')} - ${now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Por defecto, mostrar el mes actual o todo el histórico
    seleccionarPeriodoReporte('mes-actual');
});

function getAuthHeaders(custom = {}) {
    const token = localStorage.getItem('asic_token');
    const headers = { ...custom };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

function seleccionarPeriodoReporte(periodo) {
    const inputDesde = document.getElementById('rep-desde');
    const inputHasta = document.getElementById('rep-hasta');
    const inputSemana = document.getElementById('rep-semana');

    const hoy = new Date();
    const hoyStr = getLocalDateISO(hoy);

    if (periodo === 'mes-actual') {
        const primeroMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        inputDesde.value = getLocalDateISO(primeroMes);
        inputHasta.value = hoyStr;
        if (inputSemana) inputSemana.value = '';
    } else if (periodo === 'semana-actual') {
        const dia = hoy.getDay();
        const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
        const lunes = new Date(hoy.setDate(diff));
        inputDesde.value = getLocalDateISO(lunes);
        inputHasta.value = hoyStr;
        if (inputSemana) inputSemana.value = '';
    } else if (periodo === 'todos') {
        inputDesde.value = '';
        inputHasta.value = '';
        if (inputSemana) inputSemana.value = '';
        document.getElementById('rep-sector').value = '';
    }

    cargarReporteMorbilidad();
}

async function cargarReporteMorbilidad() {
    const desde = document.getElementById('rep-desde')?.value || '';
    const hasta = document.getElementById('rep-hasta')?.value || '';
    const semana = document.getElementById('rep-semana')?.value || '';
    const sector = document.getElementById('rep-sector')?.value || '';

    const params = new URLSearchParams();
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    if (semana) params.append('semana_ep', semana);
    if (sector) params.append('sector', sector);

    try {
        const res = await fetch(`/api/reportes/morbilidad?${params.toString()}`, { headers: getAuthHeaders() });
        if (res.status === 401) {
            window.location.href = '/login';
            return;
        }

        const data = await res.json();
        if (data.success) {
            renderMetricasReporte(data);
            renderTablaMorbilidad(data.consolidadoDiagnosticos || []);
            renderTablaSectores(data.consolidadoSectores || []);
        } else {
            showToast('error', 'Error', data.error || 'No se pudo generar el reporte de morbilidad.');
        }
    } catch (err) {
        console.error('Error al generar reporte:', err);
        showToast('error', 'Error de conexión', 'No se pudo comunicar con el servidor.');
    }
}

function renderMetricasReporte(data) {
    document.getElementById('rep-total-casos').textContent = data.totalCasos ?? 0;
    document.getElementById('rep-total-patologias').textContent = data.consolidadoDiagnosticos ? data.consolidadoDiagnosticos.length : 0;

    const primerSector = data.consolidadoSectores && data.consolidadoSectores[0];
    if (primerSector) {
        document.getElementById('rep-foco-principal').textContent = primerSector.sector;
        document.getElementById('rep-foco-sub').textContent = `${primerSector.casos} casos registrados (${primerSector.porcentaje})`;
    } else {
        document.getElementById('rep-foco-principal').textContent = 'Sin reportes';
        document.getElementById('rep-foco-sub').textContent = 'Período sin registros';
    }

    // Subtítulo del período
    const f = data.filtros || {};
    let subPeriodo = 'Histórico acumulado completo';
    if (f.desde && f.hasta) {
        subPeriodo = `Del ${formatDate(f.desde)} al ${formatDate(f.hasta)}`;
    } else if (f.semana_ep) {
        subPeriodo = `Semana Epidemiológica N° ${f.semana_ep}`;
    }
    document.getElementById('rep-periodo-sub').textContent = subPeriodo;
}

function renderTablaMorbilidad(lista) {
    const tbody = document.getElementById('tbody-morbilidad');
    if (!tbody) return;

    if (!lista || lista.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                    No se registraron atenciones médicas en este período epidemiológico.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = lista.map((d, index) => `
        <tr>
            <td style="font-weight: 700; color: var(--text-muted);">${index + 1}</td>
            <td>
                <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">${escapeHtml(d.diagnostico)}</span>
            </td>
            <td style="text-align: center;">
                <span class="status-badge" style="background: rgba(37, 99, 235, 0.15); color: var(--primary); font-weight: 800; font-size: 0.9rem;">
                    ${d.casos} caso${d.casos === 1 ? '' : 's'}
                </span>
            </td>
            <td style="text-align: center; font-weight: 700; color: var(--accent);">
                ${d.porcentaje}
            </td>
            <td style="font-size: 0.85rem; color: var(--text-secondary);">
                ${escapeHtml(d.sectoresDetalle || 'No georreferenciado')}
            </td>
        </tr>
    `).join('');
}

function renderTablaSectores(lista) {
    const tbody = document.getElementById('tbody-sectores');
    if (!tbody) return;

    if (!lista || lista.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    No hay casos comunitarios registrados.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = lista.map(s => {
        let badgeAlerta = `<span class="status-badge" style="background: rgba(16, 185, 129, 0.12); color: var(--success); border-color: rgba(16, 185, 129, 0.3);">Normal</span>`;
        if (s.casos >= 5) {
            badgeAlerta = `<span class="status-badge" style="background: rgba(239, 68, 68, 0.15); color: var(--danger); border-color: var(--danger);">⚠️ Alerta de Brote</span>`;
        } else if (s.casos >= 3) {
            badgeAlerta = `<span class="status-badge" style="background: rgba(245, 158, 11, 0.15); color: var(--warning); border-color: var(--warning);">Seguimiento Activo</span>`;
        }

        return `
            <tr>
                <td><strong>📍 ${escapeHtml(s.sector)}</strong></td>
                <td style="text-align: center; font-weight: 700;">${s.casos}</td>
                <td style="text-align: center; color: var(--text-secondary);">${s.porcentaje}</td>
                <td>${badgeAlerta}</td>
            </tr>
        `;
    }).join('');
}

function exportarReportePDF() {
    window.print();
}
