const express = require('express');
const router = express.Router();

function fechaLocalISO(fecha = new Date()) {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Calcula la semana epidemiológica según la fecha dada (1-53)
 */
function calcularSemanaEpidemiologica(fechaStr) {
    if (!fechaStr) return null;
    const d = new Date(fechaStr + 'T00:00:00');
    if (isNaN(d.getTime())) return null;

    // Primer día del año
    const start = new Date(d.getFullYear(), 0, 1);
    const dayOfWeek = start.getDay(); // 0: domingo
    const diff = (d - start) + ((dayOfWeek > 3 ? dayOfWeek - 7 : dayOfWeek) * 86400000);
    const oneWeek = 604800000;
    const week = Math.ceil((diff / oneWeek) + 1);
    return Math.max(1, Math.min(53, week));
}

// 1. Obtener listado de consultas con filtros epidemiológicos avanzados
router.get('/', async (req, res) => {
    try {
        const tablaConsultas = req.db.tabla('consultas');
        const tablaPacientes = req.db.tabla('pacientes');

        let lista = await tablaConsultas.select();
        const pacientes = await tablaPacientes.select();

        // Crear mapa rápido de pacientes por CI
        const pacientesMap = {};
        for (const p of pacientes) {
            pacientesMap[p.ci] = p;
        }

        // Combinar datos de la consulta con datos del paciente
        let resultado = lista.map(c => {
            const pac = pacientesMap[c.paciente_ci] || {};
            return {
                ...c,
                paciente_nombre: pac.nombre || 'Desconocido',
                paciente_apellido: pac.apellido || '',
                paciente_sector: pac.sector || 'Sin sector',
                paciente_telefono: pac.telefono || ''
            };
        });

        const { desde, hasta, semana_ep, diagnostico, sector, paciente_ci, search } = req.query;

        // Filtro por Cédula específica
        if (paciente_ci && paciente_ci.trim() !== '') {
            resultado = resultado.filter(c => c.paciente_ci.toLowerCase() === paciente_ci.trim().toLowerCase());
        }

        // Filtro por Rango de Fechas (Semanas o Periodos Epidemiológicos)
        if (desde && desde.trim() !== '') {
            resultado = resultado.filter(c => (c.fecha_consulta || '') >= desde.trim());
        }
        if (hasta && hasta.trim() !== '') {
            resultado = resultado.filter(c => (c.fecha_consulta || '') <= hasta.trim());
        }

        // Filtro por Semana Epidemiológica
        if (semana_ep && semana_ep.trim() !== '') {
            const semNum = parseInt(semana_ep, 10);
            resultado = resultado.filter(c => parseInt(c.semana_ep, 10) === semNum);
        }

        // Filtro por Diagnóstico / Patología
        if (diagnostico && diagnostico.trim() !== '') {
            const diag = diagnostico.toLowerCase().trim();
            resultado = resultado.filter(c => (c.diagnostico || '').toLowerCase().includes(diag));
        }

        // Filtro por Sector / Comunidad
        if (sector && sector.trim() !== '') {
            const sec = sector.toLowerCase().trim();
            resultado = resultado.filter(c => (c.paciente_sector || '').toLowerCase() === sec);
        }

        // Búsqueda general
        if (search && search.trim() !== '') {
            const term = search.toLowerCase().trim();
            resultado = resultado.filter(c =>
                c.paciente_ci.toLowerCase().includes(term) ||
                c.paciente_nombre.toLowerCase().includes(term) ||
                c.paciente_apellido.toLowerCase().includes(term) ||
                (c.diagnostico && c.diagnostico.toLowerCase().includes(term)) ||
                (c.sintomas && c.sintomas.toLowerCase().includes(term)) ||
                (c.paciente_sector && c.paciente_sector.toLowerCase().includes(term))
            );
        }

        // Orden cronológico: las más recientes primero
        resultado.sort((a, b) => {
            const comp = (b.fecha_consulta || '').localeCompare(a.fecha_consulta || '');
            if (comp !== 0) return comp;
            return (b.id || 0) - (a.id || 0);
        });

        res.json({
            success: true,
            total: resultado.length,
            consultas: resultado
        });
    } catch (error) {
        console.error('Error al listar consultas:', error);
        res.status(500).json({ success: false, error: 'Error al consultar las atenciones médicas.' });
    }
});

// 2. Obtener una consulta específica por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tablaConsultas = req.db.tabla('consultas');
        const tablaPacientes = req.db.tabla('pacientes');

        const consulta = await tablaConsultas.selectOne({ where: { id: parseInt(id, 10) } });
        if (!consulta) {
            return res.status(404).json({ success: false, error: 'Consulta no encontrada.' });
        }

        const paciente = await tablaPacientes.selectOne({ where: { ci: consulta.paciente_ci } });

        res.json({
            success: true,
            consulta: {
                ...consulta,
                paciente: paciente || null
            }
        });
    } catch (error) {
        console.error('Error al obtener consulta:', error);
        res.status(500).json({ success: false, error: 'Error al consultar el registro.' });
    }
});

// 3. Registrar una nueva consulta médica (Atención / Visita)
router.post('/', async (req, res) => {
    try {
        const { paciente_ci, fecha_consulta, semana_ep, sintomas, diagnostico, tratamiento, observaciones } = req.body;

        if (!paciente_ci || !sintomas || !diagnostico) {
            return res.status(400).json({
                success: false,
                error: 'Cédula del paciente, Síntomas y Diagnóstico son campos obligatorios.'
            });
        }

        const tablaPacientes = req.db.tabla('pacientes');
        const paciente = await tablaPacientes.selectOne({ where: { ci: paciente_ci.trim() } });

        if (!paciente) {
            return res.status(404).json({
                success: false,
                error: `No existe ningún paciente registrado con la cédula "${paciente_ci}". Primero debe registrarlo.`
            });
        }

        const fechaFinal = fecha_consulta && fecha_consulta.trim() !== ''
            ? fecha_consulta.trim()
            : fechaLocalISO();

        const semanaCalculada = semana_ep !== undefined && semana_ep !== ''
            ? parseInt(semana_ep, 10)
            : calcularSemanaEpidemiologica(fechaFinal);

        const nuevaConsulta = {
            paciente_ci: paciente_ci.trim(),
            fecha_consulta: fechaFinal,
            semana_ep: semanaCalculada,
            sintomas: sintomas.trim(),
            diagnostico: diagnostico.trim(),
            tratamiento: (tratamiento || '').trim(),
            observaciones: (observaciones || '').trim()
        };

        const tablaConsultas = req.db.tabla('consultas');
        const insertRes = await tablaConsultas.insert(nuevaConsulta);

        res.status(201).json({
            success: true,
            message: 'Consulta médica registrada con éxito en el historial del paciente.',
            consulta: {
                id: insertRes?.insertId || undefined,
                ...nuevaConsulta,
                paciente_nombre: `${paciente.nombre} ${paciente.apellido}`,
                paciente_sector: paciente.sector
            }
        });
    } catch (error) {
        console.error('Error al registrar consulta:', error);
        res.status(500).json({ success: false, error: 'No se pudo guardar la consulta en la base de datos.' });
    }
});

// 4. Modificar una consulta médica
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_consulta, semana_ep, sintomas, diagnostico, tratamiento, observaciones } = req.body;

        const tablaConsultas = req.db.tabla('consultas');
        const consulta = await tablaConsultas.selectOne({ where: { id: parseInt(id, 10) } });

        if (!consulta) {
            return res.status(404).json({ success: false, error: 'Consulta no encontrada.' });
        }

        const fechaFinal = fecha_consulta && fecha_consulta.trim() !== '' ? fecha_consulta.trim() : consulta.fecha_consulta;
        const semanaFinal = semana_ep !== undefined && semana_ep !== ''
            ? parseInt(semana_ep, 10)
            : (fecha_consulta ? calcularSemanaEpidemiologica(fechaFinal) : consulta.semana_ep);

        const actualizacion = {
            fecha_consulta: fechaFinal,
            semana_ep: semanaFinal,
            sintomas: sintomas !== undefined ? sintomas.trim() : consulta.sintomas,
            diagnostico: diagnostico !== undefined && diagnostico.trim() !== '' ? diagnostico.trim() : consulta.diagnostico,
            tratamiento: tratamiento !== undefined ? tratamiento.trim() : consulta.tratamiento,
            observaciones: observaciones !== undefined ? observaciones.trim() : consulta.observaciones
        };

        await tablaConsultas.update(actualizacion, { id: parseInt(id, 10) });

        res.json({
            success: true,
            message: 'Consulta médica actualizada exitosamente.',
            consulta: { ...consulta, ...actualizacion }
        });
    } catch (error) {
        console.error('Error al actualizar consulta:', error);
        res.status(500).json({ success: false, error: 'No se pudo actualizar la consulta médica.' });
    }
});

// 5. Eliminar una consulta médica
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tablaConsultas = req.db.tabla('consultas');

        const consulta = await tablaConsultas.selectOne({ where: { id: parseInt(id, 10) } });
        if (!consulta) {
            return res.status(404).json({ success: false, error: 'Consulta no encontrada.' });
        }

        await tablaConsultas.delete({ id: parseInt(id, 10) });

        res.json({
            success: true,
            message: 'Consulta médica eliminada del historial.',
            consulta
        });
    } catch (error) {
        console.error('Error al eliminar consulta:', error);
        res.status(500).json({ success: false, error: 'No se pudo eliminar la consulta.' });
    }
});

module.exports = router;
