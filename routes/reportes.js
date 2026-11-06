const express = require('express');
const router = express.Router();

function fechaLocalISO(fecha = new Date()) {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 1. Estadísticas para el Panel Principal (Dashboard)
 */
router.get('/stats', async (req, res) => {
    try {
        const tablaPacientes = req.db.tabla('pacientes');
        const tablaConsultas = req.db.tabla('consultas');

        const pacientes = await tablaPacientes.select();
        const consultas = await tablaConsultas.select();

        const todayStr = fechaLocalISO();

        const consultasHoy = consultas.filter(c => c.fecha_consulta === todayStr).length;
        const pacientesHoy = pacientes.filter(p => p.fecha_registro === todayStr).length;

        // Conteo de diagnósticos top
        const diagCount = {};
        for (const c of consultas) {
            const diag = c.diagnostico || 'No especificado';
            diagCount[diag] = (diagCount[diag] || 0) + 1;
        }

        const topDiagnosticos = Object.entries(diagCount)
            .map(([nombre, count]) => ({ nombre, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Mapa de pacientes para las últimas consultas
        const pacMap = {};
        for (const p of pacientes) {
            pacMap[p.ci] = p;
        }

        const ultimas = [...consultas]
            .sort((a, b) => (b.fecha_consulta || '').localeCompare(a.fecha_consulta || '') || (b.id - a.id))
            .slice(0, 6)
            .map(c => ({
                ...c,
                paciente_nombre: pacMap[c.paciente_ci] ? `${pacMap[c.paciente_ci].nombre} ${pacMap[c.paciente_ci].apellido}` : 'Desconocido',
                paciente_sector: pacMap[c.paciente_ci]?.sector || ''
            }));

        res.json({
            success: true,
            totalPacientes: pacientes.length,
            totalConsultas: consultas.length,
            consultasHoy,
            pacientesHoy,
            topDiagnosticos,
            ultimasConsultas: ultimas
        });
    } catch (error) {
        console.error('Error al calcular estadísticas:', error);
        res.status(500).json({ success: false, error: 'Error al obtener estadísticas del sistema.' });
    }
});

/**
 * 2. Reporte y Resumen Básico de Morbilidad Epidemiológica (Consolidado)
 * Filtros por rango de fechas (Semanas Epidemiológicas) y Sector
 */
router.get('/morbilidad', async (req, res) => {
    try {
        const tablaConsultas = req.db.tabla('consultas');
        const tablaPacientes = req.db.tabla('pacientes');

        let consultas = await tablaConsultas.select();
        const pacientes = await tablaPacientes.select();

        const pacMap = {};
        for (const p of pacientes) {
            pacMap[p.ci] = p;
        }

        const { desde, hasta, semana_ep, sector } = req.query;

        // Aplicar filtros
        if (desde && desde.trim() !== '') {
            consultas = consultas.filter(c => (c.fecha_consulta || '') >= desde.trim());
        }
        if (hasta && hasta.trim() !== '') {
            consultas = consultas.filter(c => (c.fecha_consulta || '') <= hasta.trim());
        }
        if (semana_ep && semana_ep.trim() !== '') {
            const sem = parseInt(semana_ep, 10);
            consultas = consultas.filter(c => parseInt(c.semana_ep, 10) === sem);
        }
        if (sector && sector.trim() !== '') {
            consultas = consultas.filter(c => {
                const pac = pacMap[c.paciente_ci];
                return pac && (pac.sector || '').toLowerCase() === sector.trim().toLowerCase();
            });
        }

        const totalCasos = consultas.length;

        // Consolidar por Diagnóstico / Patología
        const diagMap = {};
        // Consolidar por Sector
        const sectorMap = {};

        for (const c of consultas) {
            const pac = pacMap[c.paciente_ci] || {};
            const diag = c.diagnostico || 'Sin Diagnóstico';
            const sec = pac.sector || 'Casco Central';

            // Por diagnóstico
            if (!diagMap[diag]) {
                diagMap[diag] = { casos: 0, sectores: {} };
            }
            diagMap[diag].casos++;
            diagMap[diag].sectores[sec] = (diagMap[diag].sectores[sec] || 0) + 1;

            // Por sector
            sectorMap[sec] = (sectorMap[sec] || 0) + 1;
        }

        // Formatear tabla de morbilidad
        const consolidadoDiagnosticos = Object.entries(diagMap)
            .map(([diagnostico, data]) => {
                const pct = totalCasos > 0 ? ((data.casos / totalCasos) * 100).toFixed(1) : 0;
                const sectoresDetalle = Object.entries(data.sectores)
                    .map(([sec, count]) => `${sec} (${count})`)
                    .join(', ');
                return {
                    diagnostico,
                    casos: data.casos,
                    porcentaje: `${pct}%`,
                    sectoresDetalle
                };
            })
            .sort((a, b) => b.casos - a.casos);

        // Formatear distribución por sectores (Focos comunitarios)
        const consolidadoSectores = Object.entries(sectorMap)
            .map(([sec, count]) => {
                const pct = totalCasos > 0 ? ((count / totalCasos) * 100).toFixed(1) : 0;
                return {
                    sector: sec,
                    casos: count,
                    porcentaje: `${pct}%`
                };
            })
            .sort((a, b) => b.casos - a.casos);

        // Consultas detalladas para el reporte o exportación
        const consultasDetalle = consultas.map(c => {
            const pac = pacMap[c.paciente_ci] || {};
            return {
                id: c.id,
                fecha: c.fecha_consulta,
                semana_ep: c.semana_ep,
                ci: c.paciente_ci,
                paciente: `${pac.nombre || ''} ${pac.apellido || ''}`.trim(),
                sector: pac.sector || '',
                sintomas: c.sintomas,
                diagnostico: c.diagnostico,
                tratamiento: c.tratamiento || ''
            };
        }).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

        res.json({
            success: true,
            totalCasos,
            filtros: {
                desde: desde || null,
                hasta: hasta || null,
                semana_ep: semana_ep || null,
                sector: sector || null
            },
            consolidadoDiagnosticos,
            consolidadoSectores,
            consultasDetalle
        });
    } catch (error) {
        console.error('Error al generar consolidado de morbilidad:', error);
        res.status(500).json({ success: false, error: 'Error al procesar el reporte de morbilidad.' });
    }
});

module.exports = router;
