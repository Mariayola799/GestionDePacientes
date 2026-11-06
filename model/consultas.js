const tablaModel = require("tabla-model");

/*
 * Modelo de Consultas / Atenciones Médicas para MySQL (3FN)
 * Relación 1:N con la tabla Pacientes
 * Diferencia síntomas de diagnóstico / patología y registra semana epidemiológica
 */
const consultas = new tablaModel("consultas", {
    colums: [
        {
            name: "id",
            type: "integer",
            primary: true,
            defaultNull: false,
            autoincrement: true
        },
        {
            name: "paciente_ci",
            type: "varchar(45)",
            defaultNull: false
        },
        {
            name: "fecha_consulta",
            type: "varchar(45)",
            defaultNull: false
        },
        {
            name: "semana_ep",
            type: "integer",
            defaultNull: true
        },
        {
            name: "sintomas",
            type: "text",
            defaultNull: false
        },
        {
            name: "diagnostico",
            type: "varchar(150)",
            defaultNull: false
        },
        {
            name: "tratamiento",
            type: "text",
            defaultNull: true
        },
        {
            name: "observaciones",
            type: "text",
            defaultNull: true
        }
    ]
});

/**
 * Inicializa consultas de prueba en MySQL si la tabla está vacía
 * @param {object} db - Conexión de mysql-tab
 */
async function inicializarConsultas(db) {
    try {
        const tabla = db.tabla('consultas');
        const lista = await tabla.select();

        if (!lista || lista.length === 0) {
            const seedConsultas = [
                {
                    paciente_ci: "V-28491823",
                    fecha_consulta: "2026-10-15",
                    semana_ep: 42,
                    sintomas: "Fiebre alta de 39°C, cefalea intensa, mialgias y dolor retroocular",
                    diagnostico: "Dengue Clásico",
                    tratamiento: "Acetaminofén 500mg c/6h, hidratación oral abundante (suero), reposo absoluto",
                    observaciones: "Caso sospechoso de dengue en el sector Los Samanes. Seguimiento plaquetario"
                },
                {
                    paciente_ci: "V-28491823",
                    fecha_consulta: "2026-10-22",
                    semana_ep: 43,
                    sintomas: "Control post-dengue, astenia leve, afebril sin signos de alarma",
                    diagnostico: "Control Post-Infeccioso (Dengue)",
                    tratamiento: "Vitaminoterapia y dieta balanceada",
                    observaciones: "Evolución satisfactoria. Plaquetas en 185.000"
                },
                {
                    paciente_ci: "V-19827364",
                    fecha_consulta: "2026-10-17",
                    semana_ep: 42,
                    sintomas: "Cifras tensionales elevadas (160/100 mmHg), mareos matutinos y acúfenos",
                    diagnostico: "Hipertensión Arterial Grado II",
                    tratamiento: "Losartán Potásico 50mg diario, dieta hiposódica",
                    observaciones: "Paciente remitida a consulta de cardiología y control semanal de PA"
                },
                {
                    paciente_ci: "V-19827364",
                    fecha_consulta: "2026-10-31",
                    semana_ep: 44,
                    sintomas: "Control de presión arterial. PA: 130/80 mmHg. Sin mareos",
                    diagnostico: "Hipertensión Arterial (Controlada)",
                    tratamiento: "Mantener Losartán 50mg diario",
                    observaciones: "Excelente apego al tratamiento farmacológico y dieta"
                },
                {
                    paciente_ci: "V-30112459",
                    fecha_consulta: "2026-10-18",
                    semana_ep: 42,
                    sintomas: "Tos seca persistente, odinofagia, rinorrea y disnea leve de esfuerzo",
                    diagnostico: "Infección Respiratoria Aguda (IRA)",
                    tratamiento: "Amoxicilina 500mg c/8h por 7 días, Loratadina 10mg diario",
                    observaciones: "Descartar cuadro broncoobstructivo. Control en 5 días si persiste"
                },
                {
                    paciente_ci: "V-22194837",
                    fecha_consulta: "2026-10-25",
                    semana_ep: 43,
                    sintomas: "Evacuaciones líquidas frecuentes (5 en 24h), dolor tipo cólico y náuseas",
                    diagnostico: "Síndrome Diarreico Agudo (SDA)",
                    tratamiento: "Sales de rehidratación oral (SRO), Probióticos y dieta blanda astringente",
                    observaciones: "Posible foco hídrico en Sector 2 de Barrio Bolívar"
                },
                {
                    paciente_ci: "V-17554321",
                    fecha_consulta: "2026-10-28",
                    semana_ep: 44,
                    sintomas: "Fiebre moderada de 38.5°C, erupción cutánea macular y prurito",
                    diagnostico: "Dengue Clásico",
                    tratamiento: "Paracetamol 500mg c/8h, loción de calamina",
                    observaciones: "Segundo caso registrado en la parroquia esta semana"
                },
                {
                    paciente_ci: "V-22194837",
                    fecha_consulta: "2026-11-02",
                    semana_ep: 44,
                    sintomas: "Fiebre de 38°C, malestar general, dolor abdominal difuso",
                    diagnostico: "Síndrome Febril Agudo",
                    tratamiento: "Antipiréticos y exámenes de laboratorio",
                    observaciones: "Visita de control en evolución"
                }
            ];

            for (const c of seedConsultas) {
                await tabla.insert(c);
            }
            console.log(`>> [MySQL] ${seedConsultas.length} consultas médicas iniciales cargadas.`);
        }
    } catch (error) {
        console.error("Error al inicializar consultas en MySQL:", error);
    }
}

module.exports = consultas;
module.exports.inicializarConsultas = inicializarConsultas;
