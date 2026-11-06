-- ========================================================
-- Base de Datos Normalizada: asic_miranda (1FN, 2FN, 3FN)
-- Sistema Web de Registro y Control Epidemiológico de Pacientes
-- ASIC Miranda - Área de Epidemiología y Morbilidad
-- Incluye estructura completa y ~100 registros de prueba
-- ========================================================

CREATE DATABASE IF NOT EXISTS `asic_miranda` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `asic_miranda`;

-- --------------------------------------------------------
-- 1. Estructura para la tabla `usuarios` (Autenticación)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user` VARCHAR(100) NOT NULL UNIQUE,
  `hash` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 2. Estructura para la tabla `pacientes` (Entidad Paciente - 3FN)
-- Datos demográficos y de geolocalización (Sector/Comunidad)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pacientes` (
  `ci` VARCHAR(45) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `telefono` VARCHAR(45) DEFAULT NULL,
  `sector` VARCHAR(100) NOT NULL DEFAULT 'Casco Central',
  `direccion` VARCHAR(255) DEFAULT NULL,
  `fecha_registro` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`ci`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 3. Estructura para la tabla `consultas` (Historial Clínico - 1:N - 3FN)
-- Diferencia síntomas ("qué siente") de diagnóstico ("patología")
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `consultas` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `paciente_ci` VARCHAR(45) NOT NULL,
  `fecha_consulta` VARCHAR(45) NOT NULL,
  `semana_ep` INT(3) DEFAULT NULL,
  `sintomas` TEXT NOT NULL,
  `diagnostico` VARCHAR(150) NOT NULL,
  `tratamiento` TEXT DEFAULT NULL,
  `observaciones` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_paciente_ci` (`paciente_ci`),
  KEY `idx_fecha_consulta` (`fecha_consulta`),
  KEY `idx_diagnostico` (`diagnostico`),
  CONSTRAINT `fk_consultas_paciente` FOREIGN KEY (`paciente_ci`) 
    REFERENCES `pacientes` (`ci`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Datos para `pacientes` (40 Pacientes de la comunidad)
-- --------------------------------------------------------
INSERT INTO `pacientes` (`ci`, `nombre`, `apellido`, `telefono`, `sector`, `direccion`, `fecha_registro`) VALUES
('V-28491823', 'Carlos', 'Mendoza', '0414-1234567', 'Los Samanes', 'Av. Bolívar, Res. Los Samanes, Apto 4B', '2026-10-15'),
('V-19827364', 'Elena', 'Rivas', '0412-9876543', '5 de Julio', 'Calle 5 de Julio, Casa #12, Miranda', '2026-10-17'),
('V-30112459', 'Marcos', 'Silva', '0416-5551234', 'El Rosal', 'Urb. El Rosal, Torre B, Piso 2', '2026-10-18'),
('V-22194837', 'Rosa', 'Guerrero', '0424-3338899', 'Barrio Bolívar', 'Sector 2, Calle San Juan, Casa 45', '2026-10-25'),
('V-17554321', 'José', 'Pérez', '0414-7774411', 'Casco Central', 'Calle Comercio, Edif. Miranda, Piso 1', '2026-10-28'),
('V-25667890', 'Ana', 'Martínez', '0412-1112233', 'Las Casitas', 'Vereda 4, Casa 18, Las Casitas', '2026-09-15'),
('V-14223456', 'Pedro', 'González', '0416-2223344', 'La Lucha', 'Callejón Los Andes, Casa 9', '2026-09-18'),
('V-27889102', 'Lucía', 'Fernández', '0424-4445566', 'San José', 'Av. Principal San José, Casa 33', '2026-09-20'),
('V-18990123', 'Miguel', 'Ramírez', '0414-8889900', 'Los Samanes', 'Calle Las Flores, Quinta María', '2026-09-22'),
('V-29445678', 'Carmen', 'Castillo', '0412-3334455', '5 de Julio', 'Sector 3, Casa 14B', '2026-09-25'),
('V-16778901', 'Jorge', 'Morales', '0416-7778899', 'El Rosal', 'Res. Paraíso, Apto 1A', '2026-09-26'),
('V-31223344', 'Valeria', 'Suárez', '0424-5556677', 'Barrio Bolívar', 'Calle Central, Casa 88', '2026-09-28'),
('V-20112233', 'Andrés', 'López', '0414-6667788', 'Casco Central', 'Calle Ricaurte, Casa 21', '2026-10-01'),
('V-26334455', 'Gabriela', 'Torres', '0412-4445566', 'Las Casitas', 'Sector Las Delicias, Casa 7', '2026-10-02'),
('V-15889900', 'Héctor', 'Díaz', '0416-9990011', 'La Lucha', 'Calle Los Mangos, Casa 50', '2026-10-03'),
('V-28990011', 'Mariana', 'Vargas', '0424-1113355', 'San José', 'Sector El Trapiche, Casa 12', '2026-10-05'),
('V-13556677', 'Ramón', 'Medina', '0414-2224466', 'Los Samanes', 'Calle 2, Casa 104', '2026-10-06'),
('V-30445566', 'Daniela', 'Paredes', '0412-7779911', '5 de Julio', 'Av. Sucre, Edif. Colonial, Piso 3', '2026-10-08'),
('V-23114477', 'Luis', 'Rojas', '0416-3335577', 'El Rosal', 'Calle Urdaneta, Casa 19', '2026-10-09'),
('V-27556688', 'Patricia', 'Campos', '0424-8882244', 'Barrio Bolívar', 'Sector La Quebrada, Casa 6', '2026-10-10'),
('V-12998877', 'Fernando', 'Navarro', '0414-3336699', 'Casco Central', 'Calle Páez, Casa 72', '2026-10-11'),
('V-28113355', 'Sofía', 'Guzmán', '0412-6668800', 'Las Casitas', 'Vereda 2, Casa 41', '2026-10-12'),
('V-19446688', 'Roberto', 'Méndez', '0416-4447711', 'La Lucha', 'Av. Principal, Casa 101', '2026-10-14'),
('V-31009988', 'Camila', 'Blanco', '0424-9991133', 'San José', 'Calle San Rafael, Casa 15', '2026-10-15'),
('V-24778899', 'Javier', 'Acosta', '0414-5558822', 'Los Samanes', 'Res. El Bosque, Apto 2C', '2026-10-16'),
('V-29881122', 'Isabel', 'Santana', '0412-8881144', '5 de Julio', 'Callejón La Paz, Casa 3', '2026-10-18'),
('V-16335577', 'Manuel', 'Reyes', '0416-1114488', 'El Rosal', 'Calle Miranda, Casa 55', '2026-10-19'),
('V-25992244', 'Adriana', 'Cabrera', '0424-7773366', 'Barrio Bolívar', 'Calle Bolívar, Casa 110', '2026-10-20'),
('V-18447700', 'Ángel', 'Aguilar', '0414-4448811', 'Casco Central', 'Av. Bermúdez, Edif. San Juan', '2026-10-21'),
('V-30773311', 'Natalia', 'Herrera', '0412-2225588', 'Las Casitas', 'Calle 1, Casa 89', '2026-10-22'),
('V-22884411', 'Víctor', 'Delgado', '0416-8883377', 'La Lucha', 'Sector Bella Vista, Casa 4', '2026-10-23'),
('V-27115599', 'Diana', 'Salazar', '0424-6661199', 'San José', 'Calle La Providencia, Casa 27', '2026-10-24'),
('V-14772288', 'Raúl', 'Peña', '0414-9993355', 'Los Samanes', 'Av. Las Américas, Casa 63', '2026-10-25'),
('V-28663399', 'Laura', 'Brito', '0412-5559933', '5 de Julio', 'Calle Unión, Casa 18', '2026-10-26'),
('V-31448822', 'Alejandro', 'Escobar', '0416-2226600', 'El Rosal', 'Urb. Los Pinos, Casa 9', '2026-10-27'),
('V-20551144', 'Paola', 'Núñez', '0424-3337711', 'Barrio Bolívar', 'Vereda Central, Casa 13', '2026-10-28'),
('V-17229955', 'Enrique', 'Figueroa', '0414-7771144', 'Casco Central', 'Calle Cedeño, Casa 40', '2026-10-29'),
('V-29337744', 'Verónica', 'Carrillo', '0412-1116633', 'Las Casitas', 'Sector B, Casa 71', '2026-10-30'),
('V-24118833', 'Gustavo', 'Zambrano', '0416-5559922', 'La Lucha', 'Callejón El Carmen, Casa 11', '2026-11-01'),
('V-26883322', 'Mónica', 'Bermúdez', '0424-4441188', 'San José', 'Calle Nueva, Casa 84', '2026-11-02')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- --------------------------------------------------------
-- Datos para `consultas` (62 Consultas Médicas - Historial Clínico)
-- --------------------------------------------------------
INSERT INTO `consultas` (`paciente_ci`, `fecha_consulta`, `semana_ep`, `sintomas`, `diagnostico`, `tratamiento`, `observaciones`) VALUES
('V-28491823', '2026-10-15', 42, 'Fiebre alta de 39°C, cefalea intensa, mialgias y dolor retroocular', 'Dengue Clásico', 'Acetaminofén 500mg c/6h, hidratación oral abundante (suero), reposo absoluto', 'Caso sospechoso de dengue en el sector Los Samanes. Seguimiento plaquetario'),
('V-28491823', '2026-10-22', 43, 'Control post-dengue, astenia leve, afebril sin signos de alarma', 'Control Post-Infeccioso (Dengue)', 'Vitaminoterapia y dieta balanceada', 'Evolución satisfactoria. Plaquetas en 185.000'),
('V-19827364', '2026-10-17', 42, 'Cifras tensionales elevadas (160/100 mmHg), mareos matutinos y acúfenos', 'Hipertensión Arterial Grado II', 'Losartán Potásico 50mg diario, dieta hiposódica', 'Paciente remitida a consulta de cardiología y control semanal de PA'),
('V-19827364', '2026-10-31', 44, 'Control de presión arterial. PA: 130/80 mmHg. Sin mareos', 'Hipertensión Arterial (Controlada)', 'Mantener Losartán 50mg diario', 'Excelente apego al tratamiento farmacológico y dieta'),
('V-30112459', '2026-10-18', 42, 'Tos seca persistente, odinofagia, rinorrea y disnea leve de esfuerzo', 'Infección Respiratoria Aguda (IRA)', 'Amoxicilina 500mg c/8h por 7 días, Loratadina 10mg diario', 'Descartar cuadro broncoobstructivo. Control en 5 días si persiste'),
('V-22194837', '2026-10-25', 43, 'Evacuaciones líquidas frecuentes (5 en 24h), dolor tipo cólico y náuseas', 'Síndrome Diarreico Agudo (SDA)', 'Sales de rehidratación oral (SRO), Probióticos y dieta blanda astringente', 'Posible foco hídrico en Sector 2 de Barrio Bolívar'),
('V-17554321', '2026-10-28', 44, 'Fiebre moderada de 38.5°C, erupción cutánea macular y prurito', 'Dengue Clásico', 'Paracetamol 500mg c/8h, loción de calamina', 'Segundo caso registrado en la parroquia esta semana'),
('V-22194837', '2026-11-02', 44, 'Fiebre de 38°C, malestar general, dolor abdominal difuso', 'Síndrome Febril Agudo', 'Antipiréticos y exámenes de laboratorio', 'Visita de control en evolución'),
('V-25667890', '2026-09-23', 38, 'Diarrea acuosa abundante de 24h de evolución, vómitos y sed intensa', 'Síndrome Diarreico Agudo (SDA)', 'SRO 1L al día, sulfato de zinc, dieta blanda astringente', 'Foco hídrico sospechoso en Las Casitas. Examen coprológico solicitado'),
('V-25667890', '2026-09-30', 39, 'Paciente asintomática, tolerancia oral completa y heces formadas', 'Control Post-Gastroenteritis', 'Probióticos por 5 días', 'Recuperada sin signos de deshidratación'),
('V-14223456', '2026-09-26', 39, 'Tos seca espasmódica de predominio nocturno, disnea moderada y tiraje intercostal', 'Crisis Asmática Leve', 'Salbutamol inhalador 2 puff cada 6 horas, Prednisona 20mg x 3 días', 'Historial de asma bronquial reactivo a cambios climáticos'),
('V-14223456', '2026-10-04', 40, 'Auscultación con murmullo vesicular conservado, sin sibilancias', 'Asma Bronquial Compensada', 'Salbutamol de rescate según necesidad', 'Plan de acción para asma entregado al paciente'),
('V-27889102', '2026-09-29', 40, 'Dolor pélvico punzante, disuria y polaquiuria intensa', 'Infección Urinaria Baja', 'Ciprofloxacina 500mg cada 12 horas por 7 días, analgésico urinario', 'Urocultivo solicitado antes de iniciar antibiótico'),
('V-18990123', '2026-10-02', 40, 'Fiebre intermitente de 39°C, mialgias en miembros inferiores, dolor retroocular', 'Dengue Clásico', 'Acetaminofén 500mg c/6h, suero de rehidratación oral abundante', 'Vigilancia activa de casos febriles en Los Samanes'),
('V-18990123', '2026-10-09', 41, 'Afebril desde hace 4 días, sin sangrados ni petequias cutáneas', 'Control Post-Febril (Dengue)', 'Reposo relativo y alimentación hipercalórica', 'Caso cerrado sin complicaciones. Plaquetas en 190.000'),
('V-29445678', '2026-10-03', 40, 'Prurito intenso generalizado, pápulas y lesiones lineales en pliegues interdigitales', 'Escabiosis / Afección Cutánea', 'Permetrina loción al 5% aplicación nocturna, Loratadina 10mg diario', 'Tratamiento indicado a todo el núcleo familiar conviviente'),
('V-29445678', '2026-10-15', 42, 'Remisión casi completa de lesiones cutáneas y cese del prurito nocturno', 'Escabiosis en Resolución', 'Medidas higiénicas y lavado de ropa de cama con agua caliente', 'Excelente respuesta al tratamiento tópico'),
('V-16778901', '2026-10-04', 40, 'Dolor retroesternal urente, pirosis postprandial y regurgitación ácida', 'Enfermedad por Reflujo Gastroesofágico', 'Omeprazol 20mg en ayunas por 14 días, medidas dietéticas', 'Evitar comidas copiosas y acostarse tras la ingesta'),
('V-31223344', '2026-10-06', 41, 'Fiebre alta de 39°C de inicio súbito, dolor retroocular y eritema facial', 'Dengue Clásico', 'Paracetamol 500mg cada 6 horas, abundante líquido oral', 'Sector Barrio Bolívar, antecedente de casos cercanos en la comunidad'),
('V-31223344', '2026-10-13', 42, 'Afebril, estado general conservado, plaquetas estables en 175.000', 'Evolución Favorable Dengue', 'Mantener hidratación oral y reposo', 'Control post-febril satisfactorio'),
('V-20112233', '2026-10-07', 41, 'Congestión nasal severa, rinorrea hialina, estornudos en salva y cefalea frontal', 'Infección Respiratoria Aguda (IRA)', 'Cetirizina 10mg diario, lavados nasales con solución fisiológica', 'Cuadro viral de vías respiratorias superiores'),
('V-26334455', '2026-10-09', 41, 'Diarrea líquida con 4 episodios al día, dolor periumbilical tipo retortijón', 'Síndrome Diarreico Agudo (SDA)', 'Suero oral, dieta astringente, Probióticos 1 sobre diario', 'Segundo caso reportado de la semana en el sector Las Casitas'),
('V-15889900', '2026-10-11', 41, 'Dolor articular matutino en rodillas y codos con rigidez de 30 minutos', 'Osteoartritis / Dolor Articular Crónico', 'Ibuprofeno 400mg con las comidas, ejercicios articulares de bajo impacto', 'Remitido a consulta de medicina física ambulatoria'),
('V-28990011', '2026-10-12', 41, 'Fiebre de 38.5°C, odinofagia intensa con placas exudativas en amígdalas', 'Amigdalitis Bacteriana Aguda', 'Penicilina Benzatínica 1.200.000 UI dosis única IM, analgésicos', 'Control en 48 horas si persiste cuadro febril'),
('V-13556677', '2026-10-13', 42, 'Presión arterial 150/95 mmHg en control rutinario, mareo leve ocasional', 'Hipertensión Arterial', 'Enalapril 20mg cada 12 horas, restricción de sodio en la dieta', 'Ingresado al programa de salud cardiovascular del ASIC'),
('V-30445566', '2026-10-15', 42, 'Fiebre de 39°C, quebrantamiento corporal y exantema en tronco', 'Dengue Clásico', 'Acetaminofén 500mg c/6h, hidratación continua con suero', 'Sector 5 de Julio, vigilancia epidemiológica activa'),
('V-30445566', '2026-10-21', 43, 'Afebril, remisión del sarpullido, recuento plaquetario dentro de límites', 'Control Post-Infeccioso', 'Vitaminoterapia y reposo relativo', 'Paciente recuperada'),
('V-23114477', '2026-10-16', 42, 'Prurito anal nocturno, dolor abdominal difuso e inapetencia', 'Parasitosis Intestinal', 'Albendazol 400mg dosis única, repetir a los 15 días', 'Tratamiento preventivo recomendado a todo el grupo familiar'),
('V-27556688', '2026-10-17', 42, 'Tos con expectoración verdosa, dolor torácico tipo pleurítico y fiebre de 38°C', 'Infección Respiratoria Aguda (IRA)', 'Azitromicina 500mg diario por 5 días, Paracetamol', 'Descartar cuadro neumónico adquirido en la comunidad'),
('V-12998877', '2026-10-18', 42, 'Glucemia en ayunas elevada (180 mg/dL), polidipsia y poliuria', 'Diabetes Mellitus Tipo 2 (Descompensada)', 'Metformina 850mg con el almuerzo, dieta estricta para diabéticos', 'Ingreso al club de diabetes y control de pie diabético'),
('V-12998877', '2026-11-01', 44, 'Glucemia en ayunas normalizada a 125 mg/dL, sin síntomas cardinales', 'Diabetes Mellitus Tipo 2 (Compensada)', 'Continuar Metformina 850mg y caminata diaria', 'Excelente respuesta al plan nutricional'),
('V-28113355', '2026-10-19', 42, 'Dolor cólico intenso en hipogastrio, vómito y diarrea con moco', 'Síndrome Diarreico Agudo (SDA)', 'Rehidratación oral, Metronidazol 500mg cada 8 horas por 5 días', 'Se envía reporte de incidencia hídrica en Las Casitas'),
('V-19446688', '2026-10-20', 43, 'Fiebre persistente de 4 días, cefalea intensa y epistaxis leve autolimitada', 'Dengue con Signos de Alarma', 'Hidratación parenteral inicial, observación médica por 12 horas, Paracetamol', 'Plaquetas en 95.000. Monitoreo estrecho de signos de alarma'),
('V-19446688', '2026-10-27', 44, 'Plaquetas recuperadas a 160.000, afebril, sin signos hemorrágicos', 'Dengue en Recuperación', 'Dieta hiperproteica y reposo en casa', 'Dado de alta de vigilancia intensiva'),
('V-31009988', '2026-10-21', 43, 'Rinorrea purulenta, congestión facial maxilar y dolor a la palpación frontal', 'Sinusitis Aguda', 'Amoxicilina / Ácido Clavulánico 875/125mg c/12h x 7 días', 'Evolución tórpida de infección respiratoria previa'),
('V-24778899', '2026-10-22', 43, 'Fiebre de 38.6°C, artralgias severas en tobillos y muñecas, malestar general', 'Síndrome Febril Agudo', 'Acetaminofén 500mg cada 6 horas, abundante hidratación', 'Descartar arbovirosis en sector Los Samanes'),
('V-29881122', '2026-10-23', 43, 'Tos seca persistente, mialgias, fatiga y pérdida transitoria del olfato', 'COVID-19 (Cuadro Leve)', 'Aislamiento domiciliario, Paracetamol 500mg, reposo', 'Prueba rápida de antígeno positiva. Ficha epidemiológica llena'),
('V-29881122', '2026-10-30', 44, 'Recuperación del olfato, cese de tos, sin dificultad respiratoria', 'Control Post-COVID-19', 'Fin del período de aislamiento preventivo', 'Alta epidemiológica otorgada'),
('V-16335577', '2026-10-24', 43, 'Dolor punzante en fosa ilíaca izquierda, estreñimiento de 4 días', 'Colopatía Espasmódica / Estreñimiento', 'Trimebutina 200mg c/8h, dieta alta en fibra e hidratación', 'Descartar patología diverticular si persiste'),
('V-25992244', '2026-10-25', 43, 'Fiebre 39°C, mialgias y dolor retroocular intenso de inicio agudo', 'Dengue Clásico', 'Acetaminofén 500mg c/6h, suero oral continuo', 'Caso en Barrio Bolívar. Foco vectorial persistente'),
('V-25992244', '2026-11-01', 44, 'Afebril, sin manifestaciones hemorrágicas, mejoría sustancial', 'Dengue en Convalecencia', 'Reposo domiciliario y alimentación balanceada', 'Recuperación clínica'),
('V-18447700', '2026-10-26', 43, 'Tos húmeda, fiebre de 38.2°C y sibilancias respiratorias bilaterales', 'Infección Respiratoria Aguda (IRA)', 'Salbutamol en spray, Amoxicilina 500mg c/8h x 7 días', 'Paciente con antecedente tabáquico'),
('V-30773311', '2026-10-27', 44, 'Evacuaciones diarreicas frecuentes, dolor abdominal tipo cólico y náuseas', 'Síndrome Diarreico Agudo (SDA)', 'SRO 2 litros al día, Zinc, dieta líquida astringente', 'Las Casitas sector B, posible ingesta de agua no tratada'),
('V-22884411', '2026-10-28', 44, 'Dorsolumbalgia mecánica tras esfuerzo físico, contractura paravertebral', 'Lumbago Mecánico Agudo', 'Diclofenac sódico 50mg c/8h con protector gástrico, calor local', 'Reposo relativo 72 horas'),
('V-27115599', '2026-10-29', 44, 'Cefalea holocraneana tensional, mareos y fotofobia leve', 'Cefalea Tensional / Estrés', 'Ketoprofeno 100mg SOS, descanso e higiene del sueño', 'Sin signos de focalidad neurológica'),
('V-14772288', '2026-10-30', 44, 'Fiebre 38.5°C, escalofríos y dolor articular en hombros y rodillas', 'Dengue Clásico', 'Paracetamol 500mg cada 6 horas, sales orales', 'Los Samanes, nuevo caso reportado para fumigación'),
('V-28663399', '2026-10-31', 44, 'Odinofagia severa, fiebre de 38°C, adenopatías cervicales dolorosas', 'Faringoamigdalitis Aguda', 'Azitromicina 500mg diario x 3 días, Ibuprofeno', 'Control clínico en 3 días'),
('V-31448822', '2026-11-01', 44, 'Epigastralgia quemante, acidez y náuseas matutinas frecuentes', 'Gastritis Aguda', 'Pantoprazol 40mg diario en ayunas, antiácido líquido', 'Modificación estricta de hábitos alimenticios'),
('V-20551144', '2026-11-02', 44, 'Fiebre de 39°C, dolores musculares y cefalea intensa', 'Dengue Clásico', 'Acetaminofén 500mg c/6h, rehidratación oral abundante', 'Barrio Bolívar. Seguimiento de foco vectorial'),
('V-20551144', '2026-11-05', 45, 'Afebril, mejoría clínica, plaquetas en ascenso a 180.000', 'Control Post-Dengue', 'Dieta hiperproteica y reposo', 'Evolución satisfactoria'),
('V-17229955', '2026-11-02', 44, 'Cifras tensionales elevadas 150/90 mmHg en chequeo rutinario', 'Hipertensión Arterial', 'Losartán 50mg diario, evaluación cardiovascular completa', 'Control tensional semanal en el consultorio'),
('V-29337744', '2026-11-03', 45, 'Evacuaciones acuosas de 2 días de evolución, retortijones abdominales', 'Síndrome Diarreico Agudo (SDA)', 'Suero oral, dieta astringente, probióticos', 'Sector Las Casitas, notificación preventiva'),
('V-24118833', '2026-11-04', 45, 'Tos seca irritativa, estornudos y prurito nasal', 'Rinitis Alérgica / Cuadro Respiratorio', 'Loratadina 10mg diario, lavados nasales salinos', 'Antecedente alérgico estacional'),
('V-26883322', '2026-11-05', 45, 'Fiebre de 38.7°C, mialgias intensas y cansancio extremo', 'Dengue Clásico', 'Paracetamol 500mg cada 6 horas, hidratación con suero', 'Sector San José. Alerta emitida al equipo de vectores'),
('V-18990123', '2026-11-05', 45, 'Chequeo médico laboral preventivo', 'Evaluación Preventiva / Sano', 'Mantener estilo de vida saludable', 'Signos vitales normales'),
('V-27889102', '2026-11-05', 45, 'Control de presión arterial ambulatoria: 120/80 mmHg', 'Control Rutinario', 'Mantener hábitos saludables', 'Paciente normotensa'),
('V-16778901', '2026-11-05', 45, 'Cese de síntomas de reflujo gástrico', 'Esofagitis Leve en Remisión', 'Completar pauta de Omeprazol', 'Sin dolor retroesternal'),
('V-31223344', '2026-11-06', 45, 'Consulta de rutina post-recuperación de dengue', 'Control Post-Infeccioso', 'Reincorporación laboral', 'Alta definitiva'),
('V-22194837', '2026-11-06', 45, 'Evaluación de control de salud general', 'Control Rutinario', 'Dieta equilibrada', 'Buen estado general'),
('V-17554321', '2026-11-06', 45, 'Control ambulatorio sin sintomatología febril', 'Paciente Sano', 'Ninguno', 'Alta clínica de seguimiento'),
('V-30112459', '2026-11-06', 45, 'Auscultación pulmonar de control completamente limpia', 'Control Respiratorio', 'Ninguno', 'Cuadro respiratorio totalmente resuelto')
ON DUPLICATE KEY UPDATE `diagnostico` = VALUES(`diagnostico`);
