const tablaModel = require("tabla-model");

/*
 * Modelo de Pacientes para MySQL (3FN)
 * Contiene datos demográficos y georreferenciales (Sector/Comunidad)
 */
const pacientes = new tablaModel("pacientes", {
    colums: [
        {
            name: "ci",
            type: "varchar(45)",
            primary: true,
            defaultNull: false
        },
        {
            name: "nombre",
            type: "varchar(100)",
            defaultNull: false
        },
        {
            name: "apellido",
            type: "varchar(100)",
            defaultNull: false
        },
        {
            name: "telefono",
            type: "varchar(45)",
            defaultNull: true
        },
        {
            name: "sector",
            type: "varchar(100)",
            defaultNull: false
        },
        {
            name: "direccion",
            type: "varchar(255)",
            defaultNull: true
        },
        {
            name: "fecha_registro",
            type: "varchar(45)",
            defaultNull: false
        }
    ]
});

/**
 * Inicializa pacientes de prueba en MySQL si la tabla está vacía
 * @param {object} db - Conexión de mysql-tab
 */
async function inicializarPacientes(db) {
    try {
        const tabla = db.tabla('pacientes');
        const lista = await tabla.select();
        
        if (!lista || lista.length === 0) {
            const seedData = [
                {
                    ci: "V-28491823",
                    nombre: "Carlos",
                    apellido: "Mendoza",
                    telefono: "0414-1234567",
                    sector: "Los Samanes",
                    direccion: "Av. Bolívar, Res. Los Samanes, Apto 4B",
                    fecha_registro: "2026-10-15"
                },
                {
                    ci: "V-19827364",
                    nombre: "Elena",
                    apellido: "Rivas",
                    telefono: "0412-9876543",
                    sector: "5 de Julio",
                    direccion: "Calle 5 de Julio, Casa #12, Miranda",
                    fecha_registro: "2026-10-17"
                },
                {
                    ci: "V-30112459",
                    nombre: "Marcos",
                    apellido: "Silva",
                    telefono: "0416-5551234",
                    sector: "El Rosal",
                    direccion: "Urb. El Rosal, Torre B, Piso 2",
                    fecha_registro: "2026-10-18"
                },
                {
                    ci: "V-22194837",
                    nombre: "Rosa",
                    apellido: "Guerrero",
                    telefono: "0424-3338899",
                    sector: "Barrio Bolívar",
                    direccion: "Sector 2, Calle San Juan, Casa 45",
                    fecha_registro: "2026-10-25"
                },
                {
                    ci: "V-17554321",
                    nombre: "José",
                    apellido: "Pérez",
                    telefono: "0414-7774411",
                    sector: "Casco Central",
                    direccion: "Calle Comercio, Edif. Miranda, Piso 1",
                    fecha_registro: "2026-10-28"
                }
            ];

            for (const p of seedData) {
                await tabla.insert(p);
            }
            console.log(`>> [MySQL] ${seedData.length} pacientes iniciales cargados en la base de datos.`);
        }
    } catch (error) {
        console.error("Error al inicializar pacientes en MySQL:", error);
    }
}

module.exports = pacientes;
module.exports.inicializarPacientes = inicializarPacientes;
