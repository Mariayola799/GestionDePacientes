// Conexión a Base de Datos MySQL con mysql-tab
const mysql = require('mysql-tab');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || 3306, 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'admin',
    database: process.env.DB_NAME || 'asic_miranda'
};

console.log(">> Conectando a MySQL / MariaDB con mysql-tab...");
const connect = new mysql(dbConfig);

// Registrar los modelos de datos
connect.pathModels(path.join(__dirname, '../model'));

const { inicializarUsuarioAdmin } = require('../model/usuarios.js');
const { inicializarPacientes } = require('../model/pacientes.js');
const { inicializarConsultas } = require('../model/consultas.js');

// Inicializar tablas y registros por defecto de forma asíncrona segura
async function inicializarBD() {
    try {
        await inicializarUsuarioAdmin(connect);
        await inicializarPacientes(connect);
        await inicializarConsultas(connect);
    } catch (err) {
        console.error("Error en sincronización inicial de tablas:", err);
    }
}

inicializarBD();

module.exports = connect;
