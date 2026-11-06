/**
 * ASIC Miranda - Dashboard & Triaje Rápido Controller
 */

let pacienteTriajeActual = null;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar fecha de hoy en el modal de nueva consulta
    const consFecha = document.getElementById('cons-fecha');
    if (consFecha) {
        consFecha.value = getLocalDateISO();
        actualizarSemanaEpAuto(consFecha.value);
    }

    loadDashboardData();
});

// Cargar estadísticas y últimas atenciones médicas
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
            document.getElementById('val-total-consultas').textContent = statsData.totalConsultas ?? 0;
            document.getElementById('val-ingresos-hoy').textContent = statsData.consultasHoy ?? 0;

            const top = statsData.topDiagnosticos && statsData.topDiagnosticos[0];
            if (top) {
                document.getElementById('val-top-diagnostico').textContent = top.nombre;
                document.getElementById('val-top-diagnostico-sub').textContent = `${top.count} casos registrados`;
            } else {
                document.getElementById('val-top-diagnostico').textContent = 'Sin datos';
            }

            renderTablaRecientes(statsData.ultimasConsultas || []);
        }
    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        showToast('error', 'Error de Carga', 'No se pudieron sincronizar los datos del servidor.');
    }
}

// Renderizar tabla de últimas consultas
function renderTablaRecientes(consultas) {
    const tbody = document.getElementById('tbody-recientes');
    if (!tbody) return;

    if (!consultas || consultas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                    No hay atenciones médicas registradas en el sistema actualmente.<br>
                    <button class="btn btn-sm btn-primary" style="margin-top: 0.75rem;" onclick="abrirModalNuevaConsulta()">Registrar primera consulta</button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = consultas.map(c => `
        <tr>
            <td><strong>${formatDate(c.fecha_consulta)}</strong></td>
            <td><span class="status-badge" style="background: var(--bg-surface-elevated); font-size: 0.75rem;">Sem ${c.semana_ep || '--'}</span></td>
            <td><span class="ci-pill" style="cursor: pointer;" onclick="triajeDirecto('${escapeHtml(c.paciente_ci)}')">${escapeHtml(c.paciente_ci)}</span></td>
            <td><strong>${escapeHtml(c.paciente_nombre || 'Paciente')}</strong></td>
            <td><span class="status-badge" style="background: rgba(6, 182, 212, 0.1); color: var(--accent); border-color: rgba(6, 182, 212, 0.2);">${escapeHtml(c.paciente_sector || 'Casco Central')}</span></td>
            <td style="max-width: 220px; font-size: 0.85rem;" title="${escapeHtml(c.sintomas)}">
                <span class="symptoms-tag">${escapeHtml(c.sintomas || 'Sin síntomas')}</span>
            </td>
            <td>
                <span style="font-weight: 700; color: var(--primary);">${escapeHtml(c.diagnostico || 'Por determinar')}</span>
            </td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="triajeDirecto('${escapeHtml(c.paciente_ci)}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    Historial
                </button>
            </td>
        </tr>
    `).join('');
}

// ==============================================================
// TRIAJE RÁPIDO: Búsqueda Inmediata por Cédula con Historial
// ==============================================================
async function ejecutarTriajeRapido(e) {
    if (e) e.preventDefault();

    const input = document.getElementById('input-triaje-ci');
    const ci = input ? input.value.trim() : '';

    if (!ci) {
        showToast('warning', 'Cédula requerida', 'Ingrese la cédula del paciente para consultar.');
        return;
    }

    const cont = document.getElementById('resultado-triaje');
    cont.style.display = 'block';
    cont.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Consultando expediente clínico...
        </div>
    `;

    try {
        const token = localStorage.getItem('asic_token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/pacientes/${encodeURIComponent(ci)}`, { headers });

        if (res.status === 404) {
            // Paciente NO encontrado -> sugerir registrarlo
            cont.innerHTML = `
                <div style="background: var(--bg-surface-elevated); border: 2px dashed var(--warning); border-radius: var(--radius-md); padding: 1.5rem; text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚠️</div>
                    <h3 style="color: var(--warning); margin-bottom: 0.5rem;">Paciente No Encontrado</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                        No existe ningún paciente registrado con la cédula <strong>"${escapeHtml(ci)}"</strong> en el ASIC Miranda.
                    </p>
                    <button class="btn btn-primary" onclick="abrirRegistroRapidoConCI('${escapeHtml(ci)}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Registrar Paciente y Abrir Consulta
                    </button>
                </div>
            `;
            return;
        }

        const data = await res.json();
        if (data.success && data.paciente) {
            pacienteTriajeActual = data.paciente;
            renderResultadoTriaje(data.paciente);
        } else {
            showToast('error', 'Error', data.error || 'No se pudo obtener la información.');
        }
    } catch (err) {
        console.error('Error en triaje:', err);
        cont.innerHTML = `
            <div style="color: var(--danger); padding: 1rem; text-align: center;">
                Error de conexión al consultar el paciente.
            </div>
        `;
    }
}

function triajeDirecto(ci) {
    const input = document.getElementById('input-triaje-ci');
    if (input) {
        input.value = ci;
        ejecutarTriajeRapido();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Renderizar la ficha y todo el historial de visitas en orden cronológico
function renderResultadoTriaje(paciente) {
    const cont = document.getElementById('resultado-triaje');
    const historial = paciente.historial || [];

    let visitasHtml = '';
    if (historial.length === 0) {
        visitasHtml = `
            <div style="background: var(--bg-surface-elevated); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md); padding: 1.5rem; text-align: center; color: var(--text-muted); margin-top: 1rem;">
                Este paciente no registra consultas médicas previas en el sistema.
            </div>
        `;
    } else {
        visitasHtml = `
            <div style="margin-top: 1.25rem;">
                <h4 style="font-size: 1rem; color: var(--text-primary); margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
                    <span>Historial de Visitas Anteriores (${historial.length}) — Orden Cronológico</span>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">Más recientes primero</span>
                </h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${historial.map((c, index) => `
                        <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-left: 4px solid ${index === 0 ? 'var(--accent)' : 'var(--primary)'}; border-radius: var(--radius-md); padding: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <div>
                                    <strong style="font-size: 0.95rem; color: var(--text-primary);">Consulta #${historial.length - index}</strong>
                                    <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 0.5rem;">📅 ${formatDate(c.fecha_consulta)}</span>
                                    <span class="status-badge" style="background: var(--bg-surface); font-size: 0.75rem; margin-left: 0.5rem;">Semana EP: ${c.semana_ep || '--'}</span>
                                </div>
                                <span style="background: rgba(37, 99, 235, 0.15); color: var(--primary); padding: 0.25rem 0.6rem; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 700;">
                                    ${escapeHtml(c.diagnostico)}
                                </span>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.75rem; margin-top: 0.5rem; font-size: 0.88rem;">
                                <div style="background: var(--bg-surface); padding: 0.6rem 0.8rem; border-radius: var(--radius-sm);">
                                    <div style="color: var(--accent); font-weight: 600; font-size: 0.78rem; text-transform: uppercase;">Síntomas Clínicos:</div>
                                    <div style="color: var(--text-secondary); margin-top: 0.2rem;">${escapeHtml(c.sintomas || 'No registrados')}</div>
                                </div>
                                <div style="background: var(--bg-surface); padding: 0.6rem 0.8rem; border-radius: var(--radius-sm);">
                                    <div style="color: var(--success); font-weight: 600; font-size: 0.78rem; text-transform: uppercase;">Tratamiento Prescrito:</div>
                                    <div style="color: var(--text-secondary); margin-top: 0.2rem;">${escapeHtml(c.tratamiento || 'Sin tratamiento farmacológico')}</div>
                                </div>
                            </div>

                            ${c.observaciones ? `
                                <div style="margin-top: 0.5rem; font-size: 0.82rem; color: var(--text-muted);">
                                    <em>Observaciones:</em> ${escapeHtml(c.observaciones)}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    cont.innerHTML = `
        <div style="background: var(--bg-surface); border: 1px solid var(--border-hover); border-radius: var(--radius-md); padding: 1.5rem; box-shadow: var(--shadow-md);">
            <!-- Encabezado del paciente -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="avatar-initials" style="width: 52px; height: 52px; font-size: 1.3rem;">
                        ${getInitials(paciente.nombre, paciente.apellido)}
                    </div>
                    <div>
                        <h3 style="font-size: 1.3rem; color: var(--text-primary); margin-bottom: 0.2rem;">
                            ${escapeHtml(paciente.nombre)} ${escapeHtml(paciente.apellido)}
                        </h3>
                        <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                            <span class="ci-pill" style="font-size: 0.95rem;">${escapeHtml(paciente.ci)}</span>
                            <span class="status-badge" style="background: rgba(6, 182, 212, 0.12); color: var(--accent); border-color: var(--accent);">
                                📍 Sector: ${escapeHtml(paciente.sector || 'Casco Central')}
                            </span>
                            <span style="font-size: 0.85rem; color: var(--text-muted);">
                                📞 ${escapeHtml(paciente.telefono || 'Sin teléfono')}
                            </span>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="abrirConsultaParaPaciente('${escapeHtml(paciente.ci)}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        + Nueva Consulta Médica
                    </button>
                    <button class="btn btn-secondary" onclick="window.print()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        Imprimir Ficha
                    </button>
                </div>
            </div>

            <!-- Datos adicionales -->
            <div style="padding: 0.75rem 0; font-size: 0.9rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-subtle);">
                <strong>Dirección de Habitación:</strong> ${escapeHtml(paciente.direccion || 'No especificada')} · 
                <strong>Fecha de Registro en ASIC:</strong> ${formatDate(paciente.fecha_registro)}
            </div>

            <!-- Historial de Visitas -->
            ${visitasHtml}
        </div>
    `;
}

function limpiarTriaje() {
    const input = document.getElementById('input-triaje-ci');
    if (input) input.value = '';
    const cont = document.getElementById('resultado-triaje');
    if (cont) {
        cont.style.display = 'none';
        cont.innerHTML = '';
    }
}

// ==============================================================
// MODAL: NUEVA CONSULTA MÉDICA
// ==============================================================
function abrirModalNuevaConsulta() {
    const form = document.getElementById('form-nueva-consulta');
    if (form) form.reset();

    const consFecha = document.getElementById('cons-fecha');
    if (consFecha) {
        consFecha.value = getLocalDateISO();
        actualizarSemanaEpAuto(consFecha.value);
    }

    openModal('modal-nueva-consulta');
}

function abrirConsultaParaPaciente(ci) {
    abrirModalNuevaConsulta();
    const inputCi = document.getElementById('cons-ci');
    if (inputCi) {
        inputCi.value = ci;
        verificarPacienteParaConsulta(ci);
    }
}

// Cálculo de Semana Epidemiológica (1-53)
function actualizarSemanaEpAuto(fechaStr) {
    const semanaInput = document.getElementById('cons-semana');
    if (!semanaInput || !fechaStr) return;

    const d = new Date(fechaStr + 'T00:00:00');
    if (isNaN(d.getTime())) return;

    const start = new Date(d.getFullYear(), 0, 1);
    const dayOfWeek = start.getDay();
    const diff = (d - start) + ((dayOfWeek > 3 ? dayOfWeek - 7 : dayOfWeek) * 86400000);
    const week = Math.ceil((diff / 604800000) + 1);
    semanaInput.value = Math.max(1, Math.min(53, week));
}

function seleccionarDiagnosticoSugerido(valor) {
    const diagInput = document.getElementById('cons-diagnostico');
    if (!diagInput) return;
    if (valor && valor !== 'OTRO') {
        diagInput.value = valor;
    } else if (valor === 'OTRO') {
        diagInput.value = '';
        diagInput.focus();
    }
}

async function verificarPacienteParaConsulta(ci) {
    const status = document.getElementById('cons-ci-status');
    if (!status || !ci.trim()) return;

    status.textContent = 'Verificando expediente...';
    status.style.color = 'var(--text-muted)';

    try {
        const token = localStorage.getItem('asic_token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/pacientes/${encodeURIComponent(ci.trim())}`, { headers });
        const data = await res.json();

        if (data.success && data.paciente) {
            status.textContent = `✓ Paciente: ${data.paciente.nombre} ${data.paciente.apellido} (${data.paciente.sector})`;
            status.style.color = 'var(--success)';
        } else {
            status.textContent = `⚠️ Paciente no registrado con la cédula "${ci}". Primero debe registrarlo.`;
            status.style.color = 'var(--danger)';
        }
    } catch (e) {
        status.textContent = 'No se pudo verificar el paciente.';
    }
}

async function guardarConsultaDesdeModal(e) {
    e.preventDefault();

    const form = document.getElementById('form-nueva-consulta');
    const formData = new FormData(form);

    const payload = {
        paciente_ci: formData.get('paciente_ci')?.trim(),
        fecha_consulta: formData.get('fecha_consulta'),
        semana_ep: formData.get('semana_ep'),
        sintomas: formData.get('sintomas')?.trim(),
        diagnostico: formData.get('diagnostico')?.trim(),
        tratamiento: formData.get('tratamiento')?.trim(),
        observaciones: formData.get('observaciones')?.trim()
    };

    if (!payload.paciente_ci || !payload.sintomas || !payload.diagnostico) {
        showToast('error', 'Campos requeridos', 'Cédula, Síntomas y Diagnóstico son obligatorios.');
        return;
    }

    try {
        const token = localStorage.getItem('asic_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/consultas', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.success) {
            showToast('success', 'Consulta Registrada', 'La atención médica fue agregada al historial.');
            closeModal('modal-nueva-consulta');

            // Refrescar triaje si estaba abierto para este paciente
            if (pacienteTriajeActual && pacienteTriajeActual.ci === payload.paciente_ci) {
                ejecutarTriajeRapido();
            }
            loadDashboardData();
        } else {
            showToast('error', 'Error al guardar', data.error || 'No se pudo guardar la consulta.');
        }
    } catch (err) {
        showToast('error', 'Error de Conexión', 'No se pudo comunicar con el servidor.');
    }
}

// ==============================================================
// REGISTRO RÁPIDO DE PACIENTE
// ==============================================================
function abrirRegistroRapidoConCI(ci) {
    const form = document.getElementById('form-registro-rapido');
    if (form) form.reset();

    const inputCi = document.getElementById('rapido-ci');
    if (inputCi) inputCi.value = ci;
    openModal('modal-registro-rapido');
}

async function guardarPacienteRapido(e) {
    e.preventDefault();

    const form = document.getElementById('form-registro-rapido');
    const formData = new FormData(form);

    const payload = {
        ci: formData.get('ci')?.trim(),
        nombre: formData.get('nombre')?.trim(),
        apellido: formData.get('apellido')?.trim(),
        telefono: formData.get('telefono')?.trim(),
        sector: formData.get('sector')?.trim(),
        direccion: formData.get('direccion')?.trim(),
        fecha_registro: getLocalDateISO()
    };

    try {
        const token = localStorage.getItem('asic_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/pacientes', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.success) {
            showToast('success', 'Paciente Registrado', `Expediente de ${payload.nombre} creado.`);
            closeModal('modal-registro-rapido');

            // Abrir consulta médica directamente para este paciente recién creado
            abrirConsultaParaPaciente(payload.ci);
            loadDashboardData();
        } else {
            showToast('error', 'Error', data.error || 'No se pudo registrar al paciente.');
        }
    } catch (err) {
        showToast('error', 'Error de conexión', 'No fue posible comunicar con el servidor.');
    }
}
