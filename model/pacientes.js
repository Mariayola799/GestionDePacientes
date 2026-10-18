const tablaModel = require("tabla-model");

/*
 * Modelo de Pacientes para MySQL
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
            name: "direccion",
            type: "varchar(255)",
            defaultNull: true
        },
        {
            name: "sintomas",
            type: "text",
            defaultNull: true
        },
        {
            name: "fecha",
            type: "varchar(45)",
            defaultNull: true
        }
    ]
});

/**
 * Inicializa pacientes en MySQL si la tabla está vacía, migrando desde dataBase.json o semillas
 * @param {object} db - Conexión de mysql-tab
 */
async function inicializarPacientes(db) {
    try {
        const tabla = db.tabla('pacientes');
        const lista = await tabla.select();
        
        if (!lista || lista.length === 0) {
            const fs = require('fs');
            const path = require('path');
            const jsonPath = path.join(__dirname, '../dataBase.json');
            
            let seedData = [
                {
                    nombre: "Carlos",
                    apellido: "Mendoza",
                    ci: "V-28491823",
                    direccion: "Av. Bolívar, Res. Los Samanes, Apto 4B",
                    sintomas: "Fiebre recurrente, cefalea intensa y dolor muscular",
                    fecha: "2026-10-15"
                },
                {
                    nombre: "Elena",
                    apellido: "Rivas",
                    ci: "V-19827364",
                    direccion: "Calle 5 de Julio, Casa #12, Miranda",
                    sintomas: "Hipertensión arterial, mareos leves matutinos",
                    fecha: "2026-10-17"
                },
                {
                    nombre: "Marcos",
                    apellido: "Silva",
                    ci: "V-30112459",
                    direccion: "Urb. El Rosal, Torre B, Piso 2",
                    sintomas: "Tos seca persistente y dificultad respiratoria leve",
                    fecha: "2026-10-18"
                }
            ];

            if (fs.existsSync(jsonPath)) {
                try {
                    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                    if (Array.isArray(raw.pacienteData) && raw.pacienteData.length > 0) {
                        seedData = raw.pacienteData;
                    }
                } catch (e) {
                    console.warn("No se pudo leer dataBase.json para inicialización, usando datos predeterminados.");
                }
            }

            for (const p of seedData) {
                await tabla.insert({
                    ci: p.ci,
                    nombre: p.nombre,
                    apellido: p.apellido,
                    direccion: p.direccion || '',
                    sintomas: p.sintomas || '',
                    fecha: p.fecha || new Date().toISOString().slice(0, 10)
                });
            }
            console.log(`>> [MySQL] ${seedData.length} pacientes iniciales cargados en la base de datos.`);
        }
    } catch (error) {
        console.error("Error al inicializar pacientes en MySQL:", error);
    }
}

module.exports = pacientes;
module.exports.inicializarPacientes = inicializarPacientes;
