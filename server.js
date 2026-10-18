require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const connect = require('./routes/db.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Autenticación
const JWT_SECRET = process.env.JWT_SECRET || 'asic-miranda-secret-key-24h-auth-2026';
const TOKEN_EXPIRY = '24h'; // Token de 24 horas solicitado

// Middlewares base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware para inyectar la conexión MySQL de mysql-tab en req.db (idéntico a GestionNotasLiceo)
app.use((req, res, next) => {
    req.db = connect;
    next();
});

// ==========================================
// UTILIDADES Y MIDDLEWARES DE AUTENTICACIÓN
// ==========================================

/**
 * Extrae y valida el token JWT desde la cookie o el header Authorization
 */
function verifyToken(req) {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            token = parts[1];
        }
    }

    if (!token) return null;

    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

/**
 * Middleware para proteger vistas Web (HTML).
 * Si no hay sesión válida de 24h, redirige a /login.
 */
function requireWebAuth(req, res, next) {
    const decoded = verifyToken(req);
    if (!decoded) {
        res.clearCookie('token');
        return res.redirect('/login');
    }
    req.user = decoded;
    next();
}

/**
 * Middleware para proteger endpoints de la API REST.
 * Si no hay sesión válida, responde con 401 Unauthorized.
 */
function requireApiAuth(req, res, next) {
    const decoded = verifyToken(req);
    if (!decoded) {
        return res.status(401).json({
            success: false,
            error: 'Sesión no válida o expirada (Token de 24 horas requerido). Por favor inicie sesión.',
            code: 'UNAUTHORIZED'
        });
    }
    req.user = decoded;
    next();
}

// Redireccionar accesos directos a archivos HTML protegidos
app.use((req, res, next) => {
    if (req.path === '/index.html') return res.redirect('/');
    if (req.path === '/pacientes.html') return res.redirect('/pacientes');
    if (req.path === '/login.html') return res.redirect('/login');
    next();
});

// Servir archivos estáticos (CSS, JS, imágenes) sin servir index.html automáticamente
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// ==========================================
// RUTAS DE AUTENTICACIÓN (LOGIN / LOGOUT)
// ==========================================

// Endpoint para autenticarse (Login consultando MySQL)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Debe ingresar usuario y contraseña.'
            });
        }

        const usuariosTabla = req.db.tabla('usuarios');
        const userRecord = await usuariosTabla.selectOne({ where: { user: username.trim() } });

        let isPasswordCorrect = false;
        if (userRecord && userRecord.hash) {
            isPasswordCorrect = await bcrypt.compare(password, userRecord.hash);
        }

        if (isPasswordCorrect) {
            // Generar token firmado con expiración exacta de 24 horas
            const token = jwt.sign(
                {
                    username: userRecord.user,
                    role: 'admin',
                    authenticatedAt: new Date().toISOString()
                },
                JWT_SECRET,
                { expiresIn: TOKEN_EXPIRY }
            );

            // Establecer cookie HttpOnly con 24 horas de vigencia
            res.cookie('token', token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production'
            });

            return res.json({
                success: true,
                message: 'Sesión iniciada con éxito. Token válido por 24 horas.',
                token,
                user: {
                    username: userRecord.user,
                    role: 'Administrador'
                }
            });
        }

        return res.status(401).json({
            success: false,
            error: 'Usuario o contraseña incorrectos. (Prueba con usuario: admin y contraseña: admin).'
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al procesar la autenticación.' });
    }
});

// Endpoint para cerrar sesión (Logout)
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({
        success: true,
        message: 'Sesión cerrada exitosamente.'
    });
});

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

// Endpoint para verificar sesión activa
app.get('/api/auth/me', (req, res) => {
    const user = verifyToken(req);
    if (!user) {
        return res.status(401).json({ success: false, authenticated: false });
    }
    res.json({
        success: true,
        authenticated: true,
        user: {
            username: user.username,
            role: user.role,
            expiresAt: user.exp ? new Date(user.exp * 1000).toISOString() : null
        }
    });
});

// ==========================================
// RUTAS DE VISTAS WEB (PROTEGIDAS)
// ==========================================

// Vista de Login (Pública)
app.get('/login', (req, res) => {
    // Si ya tiene una sesión activa válida, redirigir directo al dashboard
    if (verifyToken(req)) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Página principal: Dashboard (Protegida)
app.get('/', requireWebAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Vista de gestión de pacientes (Protegida)
app.get('/pacientes', requireWebAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pacientes.html'));
});

// ==========================================
// API REST - GESTIÓN DE PACIENTES (PROTEGIDA EN MYSQL)
// ==========================================

// Todas las rutas de pacientes requieren sesión activa
app.use('/api/pacientes', requireApiAuth);
app.use('/api/stats', requireApiAuth);

// Obtener todos los pacientes (con opción de búsqueda y ordenamiento)
app.get('/api/pacientes', async (req, res) => {
    try {
        const tablaPacientes = req.db.tabla('pacientes');
        let lista = await tablaPacientes.select();
        const { search, sortBy, order } = req.query;

        // Filtrado por texto si se especifica
        if (search && search.trim() !== '') {
            const term = search.toLowerCase().trim();
            lista = lista.filter(p =>
                (p.nombre && p.nombre.toLowerCase().includes(term)) ||
                (p.apellido && p.apellido.toLowerCase().includes(term)) ||
                (p.ci && String(p.ci).toLowerCase().includes(term)) ||
                (p.direccion && p.direccion.toLowerCase().includes(term)) ||
                (p.sintomas && p.sintomas.toLowerCase().includes(term))
            );
        }

        // Ordenamiento
        if (sortBy) {
            const isDesc = order === 'desc';
            lista.sort((a, b) => {
                let valA = (a[sortBy] || '').toString().toLowerCase();
                let valB = (b[sortBy] || '').toString().toLowerCase();
                if (valA < valB) return isDesc ? 1 : -1;
                if (valA > valB) return isDesc ? -1 : 1;
                return 0;
            });
        }

        res.json({
            success: true,
            total: lista.length,
            pacientes: lista
        });
    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        res.status(500).json({ success: false, error: 'Error al consultar la base de datos de pacientes.' });
    }
});

// Estadísticas del sistema
app.get('/api/stats', async (req, res) => {
    try {
        const tablaPacientes = req.db.tabla('pacientes');
        const pacientes = await tablaPacientes.select();
        const todayStr = new Date().toISOString().slice(0, 10);
        
        const admittedToday = pacientes.filter(p => {
            if (!p.fecha) return false;
            return p.fecha.startsWith(todayStr);
        }).length;

        res.json({
            success: true,
            totalPacientes: pacientes.length,
            ingresosHoy: admittedToday,
            ultimosPacientes: [...pacientes].reverse().slice(0, 5)
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ success: false, error: 'Error al calcular estadísticas.' });
    }
});

// Buscar paciente específico por cédula (CI)
app.get('/api/pacientes/:ci', async (req, res) => {
    try {
        const { ci } = req.params;
        const tablaPacientes = req.db.tabla('pacientes');
        const paciente = await tablaPacientes.selectOne({ where: { ci } });

        if (!paciente) {
            return res.status(404).json({
                success: false,
                error: `No se encontró ningún paciente con la cédula "${ci}".`
            });
        }

        res.json({
            success: true,
            paciente
        });
    } catch (error) {
        console.error('Error al buscar paciente:', error);
        res.status(500).json({ success: false, error: 'Error interno al buscar el paciente.' });
    }
});

// Registrar un nuevo paciente
app.post('/api/pacientes', async (req, res) => {
    try {
        const { nombre, apellido, ci, direccion, sintomas, fecha } = req.body;

        if (!nombre || !apellido || !ci) {
            return res.status(400).json({
                success: false,
                error: 'Los campos Cédula, Nombre y Apellido son obligatorios.'
            });
        }

        const tablaPacientes = req.db.tabla('pacientes');
        const existe = await tablaPacientes.selectOne({ where: { ci: ci.trim() } });
        if (existe) {
            return res.status(409).json({
                success: false,
                error: `El paciente con cédula "${ci}" ya se encuentra registrado en el sistema.`
            });
        }

        const fechaFinal = fecha && fecha.trim() !== ''
            ? fecha.trim()
            : new Date().toISOString().slice(0, 10);

        const nuevo = {
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            ci: ci.trim(),
            direccion: (direccion || '').trim(),
            sintomas: (sintomas || '').trim(),
            fecha: fechaFinal
        };

        await tablaPacientes.insert(nuevo);

        res.status(201).json({
            success: true,
            message: 'Paciente registrado satisfactoriamente.',
            paciente: nuevo
        });
    } catch (error) {
        console.error('Error al registrar paciente:', error);
        res.status(500).json({ success: false, error: 'No se pudo guardar el paciente en MySQL.' });
    }
});

// Modificar datos de un paciente
app.put('/api/pacientes/:ci', async (req, res) => {
    try {
        const { ci } = req.params;
        const { nombre, apellido, direccion, sintomas, fecha } = req.body;

        const tablaPacientes = req.db.tabla('pacientes');
        const paciente = await tablaPacientes.selectOne({ where: { ci } });

        if (!paciente) {
            return res.status(404).json({
                success: false,
                error: `No existe ningún paciente registrado con la cédula "${ci}".`
            });
        }

        const datosActualizados = {
            nombre: nombre !== undefined && nombre !== '' ? nombre.trim() : paciente.nombre,
            apellido: apellido !== undefined && apellido !== '' ? apellido.trim() : paciente.apellido,
            direccion: direccion !== undefined ? direccion.trim() : (paciente.direccion || ''),
            sintomas: sintomas !== undefined ? sintomas.trim() : (paciente.sintomas || ''),
            fecha: (fecha !== undefined && fecha !== '') ? fecha.trim() : paciente.fecha
        };

        await tablaPacientes.update(datosActualizados, { ci });

        res.json({
            success: true,
            message: 'Datos del paciente actualizados con éxito.',
            paciente: { ...paciente, ...datosActualizados, ci }
        });
    } catch (error) {
        console.error('Error al actualizar paciente:', error);
        res.status(500).json({ success: false, error: 'No se pudo actualizar la información del paciente en MySQL.' });
    }
});

// Eliminar un paciente por cédula
app.delete('/api/pacientes/:ci', async (req, res) => {
    try {
        const { ci } = req.params;
        const tablaPacientes = req.db.tabla('pacientes');
        const paciente = await tablaPacientes.selectOne({ where: { ci } });

        if (!paciente) {
            return res.status(404).json({
                success: false,
                error: `No se encontró paciente con la cédula "${ci}" para eliminar.`
            });
        }

        await tablaPacientes.delete({ ci });

        res.json({
            success: true,
            message: `El paciente con cédula "${ci}" fue eliminado correctamente.`,
            paciente
        });
    } catch (error) {
        console.error('Error al eliminar paciente:', error);
        res.status(500).json({ success: false, error: 'No se pudo eliminar el registro del paciente en MySQL.' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  🏥 SISTEMA DE GESTIÓN DE PACIENTES - ASIC MIRANDA`);
    console.log(`======================================================`);
    console.log(`  ✓ Servidor web activo en:   http://localhost:${PORT}`);
    console.log(`  ✓ Base de datos MySQL:     ${process.env.DB_NAME || 'asic_miranda'} (mysql-tab)`);
    console.log(`  ✓ Tablas activas:          usuarios, pacientes`);
    console.log(`  ✓ Inicio de Sesión:         http://localhost:${PORT}/login`);
    console.log(`  ✓ Panel Principal:          http://localhost:${PORT}/`);
    console.log(`  ✓ Gestión de Pacientes:     http://localhost:${PORT}/pacientes`);
    console.log(`  ✓ Sesión protegida:         Token JWT de 24 horas`);
    console.log(`  ✓ Credenciales default:     admin / admin`);
    console.log(`======================================================\n`);
});
