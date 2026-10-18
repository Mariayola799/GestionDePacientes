const tablaModel = require("tabla-model");
const bcrypt = require('bcryptjs');

/*
 * Modelo de Usuarios para MySQL
 */
const usuarios = new tablaModel("usuarios", {
    colums: [ // Respetando la sintaxis 'colums' de la librería
        {
            name: "id",
            type: "integer",
            primary: true,
            defaultNull: false,
            autoincrement: true,
        },
        {
            name: "user",
            type: "varchar(100)",
            defaultNull: false,
        },
        {
            name: "hash",
            type: "varchar(255)",
            defaultNull: true,
        }
    ],
});

/**
 * Inicializa y sincroniza el usuario administrador en la base de datos MySQL
 * @param {object} db - Conexión de mysql-tab
 */
async function inicializarUsuarioAdmin(db) {
    try {
        const tabla = db.tabla('usuarios');
        
        const rootUser = process.env.ADMIN_USER || "admin";
        const rootPass = process.env.ADMIN_PASS || "admin";

        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(rootPass, salt);

        const existe = await tabla.selectOne({ where: { user: rootUser } });
        
        if (!existe) {
            await tabla.insert({
                user: rootUser,
                hash: hashedPass
            });
            console.log(`>> [MySQL] Usuario '${rootUser}' creado exitosamente.`);
        } else {
            // Si ya existe, sincronizamos el hash para asegurar que coincida
            await tabla.updateById({ hash: hashedPass }, existe.id);
            console.log(`>> [MySQL] Contraseña de '${rootUser}' sincronizada correctamente.`);
        }
    } catch (error) {
        console.error("Error al inicializar el usuario admin en MySQL:", error);
    }
}

module.exports = usuarios;
module.exports.inicializarUsuarioAdmin = inicializarUsuarioAdmin;
