/**
 * ASIC Miranda - Sistema de Gestión de Pacientes
 * Core Application Script & Utilities (Theme, Modals, Toasts, Session Management)
 */

// Theme Management (Dark / Light Mode)
(function initTheme() {
    const savedTheme = localStorage.getItem('asic_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
})();

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('asic_theme', next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    const btn = document.getElementById('btn-theme-toggle');
    if (!btn) return;
    btn.innerHTML = theme === 'dark' 
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    btn.setAttribute('title', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}

// Toast Notifications System
function showToast(type, title, message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else {
        iconSvg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
        <div class="toast-icon">${iconSvg}</div>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
    `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto dismiss after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 300);
    }, 4000);
}

// Modal Helpers
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
}

// ==========================================
// CONTROL DE SESIÓN Y AUTENTICACIÓN CLIENTE
// ==========================================

async function verificarSesionActiva() {
    // Si estamos en la página de login, no es necesario verificar ni redirigir
    if (window.location.pathname === '/login' || window.location.pathname === '/login.html') {
        return;
    }

    try {
        const token = localStorage.getItem('asic_token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/auth/me', { headers });
        if (res.status === 401) {
            localStorage.removeItem('asic_token');
            window.location.href = '/login';
            return;
        }

        const data = await res.json();
        if (data.authenticated && data.user) {
            actualizarInfoUsuarioNavbar(data.user);
        }
    } catch (e) {
        console.warn('Error verificando sesión:', e);
    }
}

function actualizarInfoUsuarioNavbar(user) {
    const userBadge = document.getElementById('nav-user-badge');
    if (userBadge) {
        userBadge.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.45rem; padding: 0.35rem 0.75rem; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-full); font-size: 0.82rem; font-weight: 600;">
                <span class="pulse-dot" style="width: 7px; height: 7px;"></span>
                <span>${escapeHtml(user.username)}</span>
                <span style="color: var(--accent); font-size: 0.75rem;">(${escapeHtml(user.role || 'Admin')})</span>
            </div>
        `;
    }
}

async function cerrarSesion() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
        // Ignorar error de red y limpiar cliente
    }
    localStorage.removeItem('asic_token');
    showToast('info', 'Sesión Finalizada', 'Has cerrado sesión.');
    setTimeout(() => {
        window.location.href = '/login';
    }, 400);
}

// Global modal backdrop close listener & ESC key
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                closeModal(backdrop.id);
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-backdrop.open').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });

    const themeToggleBtn = document.getElementById('btn-theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    verificarSesionActiva();
});

// String & Date Helpers
function escapeHtml(text) {
    if (!text && text !== 0) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getInitials(nombre, apellido) {
    const n = (nombre || '').trim().charAt(0).toUpperCase();
    const a = (apellido || '').trim().charAt(0).toUpperCase();
    return (n + a) || 'P';
}

function formatDate(dateStr) {
    if (!dateStr) return 'No especificada';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const parts = dateStr.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}

// Global Quick Patient Search
async function buscarPacientePorCedula(ci) {
    if (!ci || ci.trim() === '') {
        showToast('error', 'Cédula requerida', 'Por favor ingresa una cédula para realizar la búsqueda.');
        return null;
    }

    try {
        const token = localStorage.getItem('asic_token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/pacientes/${encodeURIComponent(ci.trim())}`, { headers });
        if (res.status === 401) {
            window.location.href = '/login';
            return null;
        }

        const data = await res.json();
        if (!res.ok || !data.success) {
            showToast('error', 'No encontrado', data.error || 'No se encontró ningún paciente con esa cédula.');
            return null;
        }
        return data.paciente;
    } catch (err) {
        showToast('error', 'Error de conexión', 'No fue posible comunicarse con el servidor.');
        return null;
    }
}
