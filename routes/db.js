// Base de datos MySQL con mysql-tab
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

console.log(">> Conectando a MySQL con mysql-tab...");
const connect = new mysql(dbConfig);

// Registrar los modelos de datos
connect.pathModels(path.join(__dirname, '../model'));

const { inicializarUsuarioAdmin } = require('../model/usuarios.js');
const { inicializarPacientes } = require('../model/pacientes.js');

// Inicializar tablas y registros por defecto
inicializarUsuarioAdmin(connect);
inicializarPacientes(connect);

module.exports = connect;
