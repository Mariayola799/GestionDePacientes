# Sistema de Control y Gestión de Pacientes 😷

Proyecto desarrollado para el **ASIC Miranda**, con servidor backend en Node.js, Express y persistencia relacional en **MySQL** mediante la librería **`mysql-tab`** (idéntico a la arquitectura del proyecto `GestionNotasLiceo`).

---

## Integrantes

Maria Rodriguez

## 🚀 Novedades: Integración con MySQL (`mysql-tab`)

El proyecto cuenta con integración completa a MySQL:
- **Base de datos propia**: `asic_miranda` (configurable vía `.env`).
- **Tabla `usuarios`**: Almacena usuarios y hashes de contraseñas con `bcryptjs`. Inicializa automáticamente al usuario `admin` con contraseña `admin` si no existe.
- **Tabla `pacientes`**: Almacena los registros médicos de los pacientes (`ci`, `nombre`, `apellido`, `direccion`, `sintomas`, `fecha`) con `ci` como clave primaria.
- **Modelos declarativos (`tabla-model`)**: Definidos en la carpeta `model/` (`usuarios.js` y `pacientes.js`).
- **Conector (`routes/db.js`)**: Gestiona la conexión con `mysql-tab`, registra los modelos (`pathModels`) e inyecta la conexión en `req.db`.
- **Script SQL (`bd.sql`)**: Incluye la creación de la base de datos, tablas y datos iniciales.

---

## 📋 Requisitos Previos

1. [Node.js](https://nodejs.org/) (versión 18 o superior).
2. Servidor MySQL en ejecución (ej. XAMPP, WampServer o servicio MySQL independiente en el puerto 3306).

---

## ⚙️ Configuración (.env)

Crea o edita el archivo `.env` en la raíz del proyecto (puedes guiarte de [.env.example](file:///c:/js/Qlq/.env.example)):

```env
# Puerto del servidor web
PORT=3000

# Clave secreta para la firma de tokens JWT (vigencia de 24 horas)
JWT_SECRET=asic-miranda-secret-key-24h-auth-2026

# Credenciales por defecto del usuario administrador
ADMIN_USER=admin
ADMIN_PASS=admin

# Configuración de la base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=admin
DB_NAME=asic_miranda
```

---

## 🗄️ Base de Datos MySQL

### Opción A (Automática con `mysql-tab`):
Al iniciar el servidor (`npm start`), la librería `mysql-tab` crea automáticamente la base de datos y las tablas a partir de los modelos si no existen, sincronizando el usuario `admin` y los datos de pacientes.

### Opción B (Manual vía SQL):
Puedes importar el script [bd.sql](file:///c:/js/Qlq/bd.sql) en phpMyAdmin, MySQL Workbench o tu cliente preferido:

```bash
mysql -u root -p < bd.sql
```

---

## 📦 Instalación

1. Abre una terminal en la carpeta del proyecto.
2. Instala las dependencias necesarias:

```bash
npm install
```

---

## 🖥️ Uso

### Iniciar la Aplicación Web

```bash
npm start
```
O directamente:
```bash
node server.js
```

Abre tu navegador web en:
- **Inicio de Sesión**: [http://localhost:3000/login](http://localhost:3000/login) (Credenciales: `admin` / `admin`)
- **Dashboard Principal**: [http://localhost:3000](http://localhost:3000)
- **Gestión de Pacientes**: [http://localhost:3000/pacientes](http://localhost:3000/pacientes)

### Modo Consola (Terminal)

Para ejecutar la versión de línea de comandos:

```bash
npm run cli
```
