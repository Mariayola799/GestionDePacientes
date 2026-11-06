const express = require('express');
const router = express.Router();

function fechaLocalISO(fecha = new Date()) {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Rutas de Gestión de Pacientes (CRUD y Triaje Rápido)
 */

// 1. Obtener todos los pacientes (con búsqueda y ordenamiento)
router.get('/', async (req, res) => {
    try {
        const tablaPacientes = req.db.tabla('pacientes');
        const tablaConsultas = req.db.tabla('consultas');

        let lista = await tablaPacientes.select();
        const todasConsultas = await tablaConsultas.select();
        const { search, sortBy, order, sector } = req.query;

        // Mapear consultas por paciente para obtener total de visitas y última consulta
        const consultasPorPaciente = {};
        for (const c of todasConsultas) {
            if (!consultasPorPaciente[c.paciente_ci]) {
                consultasPorPaciente[c.paciente_ci] = [];
            }
            consultasPorPaciente[c.paciente_ci].push(c);
        }

        // Enriquecer pacientes con historial resumido
        let resultado = lista.map(p => {
            const visitas = consultasPorPaciente[p.ci] || [];
            visitas.sort((a, b) => (b.fecha_consulta || '').localeCompare(a.fecha_consulta || ''));
            const ultima = visitas[0] || null;
            return {
                ...p,
                totalConsultas: visitas.length,
                ultimaConsultaFecha: ultima ? ultima.fecha_consulta : p.fecha_registro,
                ultimoDiagnostico: ultima ? ultima.diagnostico : 'Sin consultas registradas'
            };
        });

        // Filtrado por sector si se especifica
        if (sector && sector.trim() !== '') {
            resultado = resultado.filter(p => (p.sector || '').toLowerCase() === sector.trim().toLowerCase());
        }

        // Filtrado por texto de búsqueda
        if (search && search.trim() !== '') {
            const term = search.toLowerCase().trim();
            resultado = resultado.filter(p =>
                (p.nombre && p.nombre.toLowerCase().includes(term)) ||
                (p.apellido && p.apellido.toLowerCase().includes(term)) ||
                (p.ci && String(p.ci).toLowerCase().includes(term)) ||
                (p.sector && p.sector.toLowerCase().includes(term)) ||
                (p.direccion && p.direccion.toLowerCase().includes(term)) ||
                (p.ultimoDiagnostico && p.ultimoDiagnostico.toLowerCase().includes(term))
            );
        }

        // Ordenamiento
        if (sortBy) {
            const isDesc = order === 'desc';
            resultado.sort((a, b) => {
                let valA = (a[sortBy] || '').toString().toLowerCase();
                let valB = (b[sortBy] || '').toString().toLowerCase();
                if (valA < valB) return isDesc ? 1 : -1;
                if (valA > valB) return isDesc ? -1 : 1;
                return 0;
            });
        }

        res.json({
            success: true,
            total: resultado.length,
            pacientes: resultado
        });
    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        res.status(500).json({ success: false, error: 'Error al consultar la base de datos de pacientes.' });
    }
});

// 2. BÚSQUEDA INMEDIATA POR CÉDULA (TRIAJE RÁPIDO)
// Devuelve ficha del paciente con TODO su historial cronológico de visitas
router.get('/:ci', async (req, res) => {
    try {
        const { ci } = req.params;
        const tablaPacientes = req.db.tabla('pacientes');
        const tablaConsultas = req.db.tabla('consultas');

        const paciente = await tablaPacientes.selectOne({ where: { ci: ci.trim() } });

        if (!paciente) {
            return res.status(404).json({
                success: false,
                error: `No se encontró ningún paciente con la cédula "${ci}".`
            });
        }

        // Buscar todas las consultas del paciente
        const todasConsultas = await tablaConsultas.select({ where: { paciente_ci: ci.trim() } });
        // Ordenar en orden cronológico descendente (las más recientes primero)
        todasConsultas.sort((a, b) => {
            const comp = (b.fecha_consulta || '').localeCompare(a.fecha_consulta || '');
            if (comp !== 0) return comp;
            return (b.id || 0) - (a.id || 0);
        });

        res.json({
            success: true,
            paciente: {
                ...paciente,
                totalConsultas: todasConsultas.length,
                historial: todasConsultas
            }
        });
    } catch (error) {
        console.error('Error en triaje por cédula:', error);
        res.status(500).json({ success: false, error: 'Error interno al consultar el expediente del paciente.' });
    }
});

// 3. Registrar nuevo paciente
router.post('/', async (req, res) => {
    try {
        const { ci, nombre, apellido, telefono, sector, direccion, fecha_registro } = req.body;

        if (!ci || !nombre || !apellido) {
            return res.status(400).json({
                success: false,
                error: 'Los campos Cédula, Nombre y Apellido son estrictamente obligatorios.'
            });
        }

        const tablaPacientes = req.db.tabla('pacientes');
        const existe = await tablaPacientes.selectOne({ where: { ci: ci.trim() } });
        if (existe) {
            return res.status(409).json({
                success: false,
                error: `El paciente con cédula "${ci.trim()}" ya se encuentra registrado en el sistema.`
            });
        }

        const nuevo = {
            ci: ci.trim(),
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            telefono: (telefono || '').trim(),
            sector: (sector || 'Casco Central').trim(),
            direccion: (direccion || '').trim(),
            fecha_registro: fecha_registro && fecha_registro.trim() !== ''
                ? fecha_registro.trim()
                : fechaLocalISO()
        };

        await tablaPacientes.insert(nuevo);

        res.status(201).json({
            success: true,
            message: 'Paciente registrado satisfactoriamente en el ASIC Miranda.',
            paciente: nuevo
        });
    } catch (error) {
        console.error('Error al registrar paciente:', error);
        res.status(500).json({ success: false, error: 'No se pudo guardar el paciente en la base de datos.' });
    }
});

// 4. Modificar datos demográficos de un paciente
router.put('/:ci', async (req, res) => {
    try {
        const { ci } = req.params;
        const { nombre, apellido, telefono, sector, direccion, fecha_registro } = req.body;

        const tablaPacientes = req.db.tabla('pacientes');
        const paciente = await tablaPacientes.selectOne({ where: { ci } });

        if (!paciente) {
            return res.status(404).json({
                success: false,
                error: `No existe ningún paciente registrado con la cédula "${ci}".`
            });
        }

        const datosActualizados = {
            nombre: nombre !== undefined && nombre.trim() !== '' ? nombre.trim() : paciente.nombre,
            apellido: apellido !== undefined && apellido.trim() !== '' ? apellido.trim() : paciente.apellido,
            telefono: telefono !== undefined ? telefono.trim() : (paciente.telefono || ''),
            sector: sector !== undefined && sector.trim() !== '' ? sector.trim() : (paciente.sector || 'Casco Central'),
            direccion: direccion !== undefined ? direccion.trim() : (paciente.direccion || ''),
            fecha_registro: fecha_registro !== undefined && fecha_registro.trim() !== '' ? fecha_registro.trim() : paciente.fecha_registro
        };

        await tablaPacientes.update(datosActualizados, { ci });

        res.json({
            success: true,
            message: 'Datos del paciente actualizados con éxito.',
            paciente: { ...paciente, ...datosActualizados, ci }
        });
    } catch (error) {
        console.error('Error al actualizar paciente:', error);
        res.status(500).json({ success: false, error: 'No se pudo actualizar la información del paciente.' });
    }
});

// 5. Eliminar paciente y su historial
router.delete('/:ci', async (req, res) => {
    try {
        const { ci } = req.params;
        const tablaPacientes = req.db.tabla('pacientes');
        const tablaConsultas = req.db.tabla('consultas');

        const paciente = await tablaPacientes.selectOne({ where: { ci } });

        if (!paciente) {
            return res.status(404).json({
                success: false,
                error: `No se encontró paciente con la cédula "${ci}" para eliminar.`
            });
        }

        // Eliminar consultas asociadas (en caso de que la FK en la BD no tenga ON DELETE CASCADE o como respaldo)
        try {
            await tablaConsultas.delete({ paciente_ci: ci });
        } catch (e) {
            // si la BD lo hace por cascade, ignorar
        }

        await tablaPacientes.delete({ ci });

        res.json({
            success: true,
            message: `El paciente con cédula "${ci}" y su historial médico fueron eliminados correctamente.`,
            paciente
        });
    } catch (error) {
        console.error('Error al eliminar paciente:', error);
        res.status(500).json({ success: false, error: 'No se pudo eliminar el registro del paciente.' });
    }
});

module.exports = router;
