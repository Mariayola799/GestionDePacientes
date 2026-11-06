# Sistema Web de Control y Gestión Epidemiológica de Pacientes 🏥
### ASIC Miranda — Área de Epidemiología y Morbilidad

Desarrollado con **Node.js**, **Express**, arquitectura modular en **`routes/`**, modelos con **`tabla-model`** y persistencia relacional normalizada (**1FN, 2FN y 3FN**) en **MariaDB / MySQL** del sistema mediante **`mysql-tab`**.

---

## 👩‍💻 Integrante
- **Maria Rodriguez**

---

## 🚀 Arquitectura y Novedades del Prototipo PSIT

1. **Base de Datos Normalizada (1FN, 2FN, 3FN)**:
   - **`usuarios`**: Autenticación con contraseñas cifradas vía `bcryptjs` y sesiones JWT de 24 horas.
   - **`pacientes`**: Ficha demográfica con Cédula de Identidad (`ci` como clave primaria), nombre, apellido, teléfono, **sector/comunidad** y dirección.
   - **`consultas`**: Historial clínico con relación $1:N$ vinculada a `pacientes.ci`. Resuelve el error de clave duplicada y preserva todas las visitas sucesivas en orden cronológico.
   - **Diferenciación de Síntomas vs Diagnóstico**: Registro separado de síntomas subjetivos ("qué siente") respecto a la patología evaluada (Dengue, IRA, SDA, Hipertensión, etc.).
   - **Semanas Epidemiológicas (1-53)**: Cálculo automático y filtro por rangos de fechas para hojas oficiales de morbilidad.
   - **Georreferenciación Comunitaria (Sectores)**: Identificación de focos y brotes por sectores (Los Samanes, 5 de Julio, El Rosal, Barrio Bolívar, etc.).

2. **Triaje Rápido por Cédula**:
   - Búsqueda inmediata al ingresar la cédula del paciente, mostrando al instante sus antecedentes y todo su historial de visitas en orden cronológico.

3. **Consolidado de Morbilidad y Exportación a PDF**:
   - Vista que reproduce las hojas de morbilidad del Ministerio de Salud (conteo por patología, % de incidencia y sectores afectados).
   - Botón de exportación e impresión directa en PDF con membrete oficial del ASIC Miranda.

4. **Código Limpio y Modular (`routes/`)**:
   - Endpoints desacoplados de `server.js` en enrutadores independientes:
     - `routes/auth.js`: Autenticación y middlewares de seguridad.
     - `routes/pacientes.js`: CRUD y triaje por cédula.
     - `routes/consultas.js`: Atenciones médicas y filtros epidemiológicos.
     - `routes/reportes.js`: Estadísticas y consolidado de morbilidad.
     - `routes/views.js`: Renderizado de vistas HTML protegidas.

---

## 📋 Requisitos Previos

1. [Node.js](https://nodejs.org/) (versión 18 o superior).
2. Servidor MariaDB / MySQL en ejecución en el sistema (puerto 3306).

---

## ⚙️ Configuración (.env)

Copia o edita el archivo `.env` en la raíz del proyecto:

```env
# Puerto del servidor web
PORT=3000

# Clave secreta para firma de tokens JWT (vigencia de 24 horas)
JWT_SECRET=asic-miranda-secret-key-24h-auth-2026

# Credenciales por defecto del administrador
ADMIN_USER=admin
ADMIN_PASS=admin

# Configuración de base de datos MariaDB / MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=admin
DB_NAME=asic_miranda
```

---

## 🗄️ Puesta en Marcha de la Base de Datos

Importa el script normalizado en el servicio MariaDB del sistema:
```bash
mysql -u root -padmin asic_miranda < bd.sql
```

---

## 📦 Instalación y Ejecución

1. Instala las dependencias del proyecto:
```bash
npm install
```

2. Inicia el servidor web:
```bash
npm start
```

3. Accede desde tu navegador web:
   - **Triaje y Panel Principal**: [http://localhost:3000](http://localhost:3000)
   - **Directorio de Pacientes**: [http://localhost:3000/pacientes](http://localhost:3000/pacientes)
   - **Consultas Médicas (Semanas EP)**: [http://localhost:3000/consultas](http://localhost:3000/consultas)
   - **Reporte de Morbilidad y Exportación PDF**: [http://localhost:3000/reportes](http://localhost:3000/reportes)
   - **Inicio de Sesión**: [http://localhost:3000/login](http://localhost:3000/login) (*Credenciales default:* `admin` / `admin`)
