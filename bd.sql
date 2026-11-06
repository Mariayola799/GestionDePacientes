-- ========================================================
-- Base de Datos Normalizada: asic_miranda (1FN, 2FN, 3FN)
-- Sistema Web de Registro y Control Epidemiológico de Pacientes
-- ASIC Miranda - Área de Epidemiología y Morbilidad
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
-- Datos iniciales para `pacientes`
-- --------------------------------------------------------
INSERT INTO `pacientes` (`ci`, `nombre`, `apellido`, `telefono`, `sector`, `direccion`, `fecha_registro`) VALUES
('V-28491823', 'Carlos', 'Mendoza', '0414-1234567', 'Los Samanes', 'Av. Bolívar, Res. Los Samanes, Apto 4B', '2026-10-15'),
('V-19827364', 'Elena', 'Rivas', '0412-9876543', '5 de Julio', 'Calle 5 de Julio, Casa #12, Miranda', '2026-10-17'),
('V-30112459', 'Marcos', 'Silva', '0416-5551234', 'El Rosal', 'Urb. El Rosal, Torre B, Piso 2', '2026-10-18'),
('V-22194837', 'Rosa', 'Guerrero', '0424-3338899', 'Barrio Bolívar', 'Sector 2, Calle San Juan, Casa 45', '2026-10-25'),
('V-17554321', 'José', 'Pérez', '0414-7774411', 'Casco Central', 'Calle Comercio, Edif. Miranda, Piso 1', '2026-10-28')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- --------------------------------------------------------
-- Datos iniciales para `consultas` (Historial cronológico)
-- Muestra múltiples visitas por paciente sin error de clave duplicada
-- --------------------------------------------------------
INSERT INTO `consultas` (`id`, `paciente_ci`, `fecha_consulta`, `semana_ep`, `sintomas`, `diagnostico`, `tratamiento`, `observaciones`) VALUES
(1, 'V-28491823', '2026-10-15', 42, 'Fiebre alta de 39°C, cefalea intensa, mialgias y dolor retroocular', 'Dengue Clásico', 'Acetaminofén 500mg c/6h, hidratación oral abundante (suero), reposo absoluto', 'Caso sospechoso de dengue en el sector Los Samanes. Seguimiento plaquetario'),
(2, 'V-28491823', '2026-10-22', 43, 'Control post-dengue, astenia leve, afebril sin signos de alarma', 'Control Post-Infeccioso (Dengue)', 'Vitaminoterapia y dieta balanceada', 'Evolución satisfactoria. Plaquetas en 185.000'),
(3, 'V-19827364', '2026-10-17', 42, 'Cifras tensionales elevadas (160/100 mmHg), mareos matutinos y acúfenos', 'Hipertensión Arterial Grado II', 'Losartán Potásico 50mg diario, dieta hiposódica', 'Paciente remitida a consulta de cardiología y control semanal de PA'),
(4, 'V-19827364', '2026-10-31', 44, 'Control de presión arterial. PA: 130/80 mmHg. Sin mareos', 'Hipertensión Arterial (Controlada)', 'Mantener Losartán 50mg diario', 'Excelente apego al tratamiento farmacológico y dieta'),
(5, 'V-30112459', '2026-10-18', 42, 'Tos seca persistente, odinofagia, rinorrea y disnea leve de esfuerzo', 'Infección Respiratoria Aguda (IRA)', 'Amoxicilina 500mg c/8h por 7 días, Loratadina 10mg diario', 'Descartar cuadro broncoobstructivo. Control en 5 días si persiste'),
(6, 'V-22194837', '2026-10-25', 43, 'Evacuaciones líquidas frecuentes (5 en 24h), dolor tipo cólico y náuseas', 'Síndrome Diarreico Agudo (SDA)', 'Sales de rehidratación oral (SRO), Probióticos y dieta blanda astringente', 'Posible foco hídrico en Sector 2 de Barrio Bolívar'),
(7, 'V-17554321', '2026-10-28', 44, 'Fiebre moderada de 38.5°C, erupción cutánea macular y prurito', 'Dengue Clásico', 'Paracetamol 500mg c/8h, loción de calamina', 'Segundo caso registrado en la parroquia esta semana'),
(8, 'V-22194837', '2026-11-02', 44, 'Fiebre de 38°C, malestar general, dolor abdominal difuso', 'Síndrome Febril Agudo', 'Antipiréticos y exámenes de laboratorio', 'Visita de control en evolución')
ON DUPLICATE KEY UPDATE
  `sintomas` = VALUES(`sintomas`),
  `diagnostico` = VALUES(`diagnostico`),
  `tratamiento` = VALUES(`tratamiento`),
  `observaciones` = VALUES(`observaciones`);
