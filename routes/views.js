const express = require('express');
const path = require('path');
const router = express.Router();
const { verifyToken, requireWebAuth } = require('./auth.js');

// Redirigir accesos directos .html
router.use((req, res, next) => {
    if (req.path === '/index.html') return res.redirect('/');
    if (req.path === '/pacientes.html') return res.redirect('/pacientes');
    if (req.path === '/consultas.html') return res.redirect('/consultas');
    if (req.path === '/reportes.html') return res.redirect('/reportes');
    if (req.path === '/login.html') return res.redirect('/login');
    next();
});

// Vista de Login (Pública)
router.get('/login', (req, res) => {
    if (verifyToken(req)) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

// Logout directo desde enlace
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

// Vistas protegidas
router.get('/', requireWebAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

router.get('/pacientes', requireWebAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'pacientes.html'));
});

router.get('/consultas', requireWebAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'consultas.html'));
});

router.get('/reportes', requireWebAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'reportes.html'));
});

module.exports = router;
