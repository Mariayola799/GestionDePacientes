const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'asic-miranda-secret-key-24h-auth-2026';
const TOKEN_EXPIRY = '24h';

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
 * Redirige a /login si no hay sesión.
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
 * Responde 401 Unauthorized si no hay sesión válida.
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

// Iniciar Sesión (Login)
router.post('/login', async (req, res) => {
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
            const token = jwt.sign(
                {
                    username: userRecord.user,
                    role: 'admin',
                    authenticatedAt: new Date().toISOString()
                },
                JWT_SECRET,
                { expiresIn: TOKEN_EXPIRY }
            );

            res.cookie('token', token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
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

// Cerrar Sesión (Logout API)
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({
        success: true,
        message: 'Sesión cerrada exitosamente.'
    });
});

// Verificar sesión activa
router.get('/me', (req, res) => {
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

module.exports = {
    router,
    verifyToken,
    requireWebAuth,
    requireApiAuth
};
