require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const connect = require('./routes/db.js');

// Importar Routers modulares de routes/
const { router: authRouter, requireApiAuth } = require('./routes/auth.js');
const pacientesRouter = require('./routes/pacientes.js');
const consultasRouter = require('./routes/consultas.js');
const reportesRouter = require('./routes/reportes.js');
const viewsRouter = require('./routes/views.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Inyectar conexión MySQL de mysql-tab en req.db
app.use((req, res, next) => {
    req.db = connect;
    next();
});

// Servir archivos estáticos (CSS, JS, imágenes) sin servir index.html automáticamente
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// ==========================================
// REGISTRO DE RUTAS MODULARES (express.Router)
// ==========================================

// 1. Vistas Web
app.use('/', viewsRouter);

// 2. Autenticación (Login / Logout / Me)
app.use('/api/auth', authRouter);

// 3. API REST de Pacientes (CRUD y Triaje Rápido)
app.use('/api/pacientes', requireApiAuth, pacientesRouter);

// 4. API REST de Consultas Médicas (Filtros por Fecha, Semana Epidemiológica, Síntomas vs Diagnóstico)
app.use('/api/consultas', requireApiAuth, consultasRouter);

// 5. API REST de Reportes y Consolidado de Morbilidad
app.use('/api/reportes', requireApiAuth, reportesRouter);

// Alias de retrocompatibilidad para /api/stats
app.use('/api/stats', requireApiAuth, (req, res, next) => {
    req.url = '/stats';
    reportesRouter(req, res, next);
});

// Manejo de error 404 para APIs no encontradas
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint no encontrado.' });
});

// Iniciar servidor HTTP
app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  🏥 SISTEMA DE GESTIÓN EPIDEMIOLÓGICA - ASIC MIRANDA`);
    console.log(`======================================================`);
    console.log(`  ✓ Servidor web activo en:   http://localhost:${PORT}`);
    console.log(`  ✓ Base de datos:           ${process.env.DB_NAME || 'asic_miranda'} (MySQL / MariaDB)`);
    console.log(`  ✓ Tablas normalizadas:     usuarios, pacientes, consultas (3FN)`);
    console.log(`  ✓ Módulos activos:`);
    console.log(`     - Panel / Triaje Rápido:  http://localhost:${PORT}/`);
    console.log(`     - Directorio Pacientes:   http://localhost:${PORT}/pacientes`);
    console.log(`     - Consultas Médicas:      http://localhost:${PORT}/consultas`);
    console.log(`     - Reportes de Morbilidad: http://localhost:${PORT}/reportes`);
    console.log(`     - Inicio de Sesión:       http://localhost:${PORT}/login`);
    console.log(`  ✓ Sesión protegida:         Token JWT de 24 horas`);
    console.log(`  ✓ Credenciales default:     admin / admin`);
    console.log(`======================================================\n`);
});
