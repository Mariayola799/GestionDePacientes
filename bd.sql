-- ========================================================
-- Base de Datos: asic_miranda
-- Sistema de Gestión de Pacientes - ASIC Miranda
-- ========================================================

CREATE DATABASE IF NOT EXISTS `asic_miranda` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `asic_miranda`;

-- --------------------------------------------------------
-- Estructura para la tabla `usuarios`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user` VARCHAR(100) NOT NULL,
  `hash` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Estructura para la tabla `pacientes`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pacientes` (
  `ci` VARCHAR(45) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `direccion` VARCHAR(255) DEFAULT NULL,
  `sintomas` TEXT DEFAULT NULL,
  `fecha` VARCHAR(45) DEFAULT NULL,
  PRIMARY KEY (`ci`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Datos iniciales para `pacientes`
-- --------------------------------------------------------
INSERT INTO `pacientes` (`ci`, `nombre`, `apellido`, `direccion`, `sintomas`, `fecha`) VALUES
('V-28491823', 'Carlos', 'Mendoza', 'Av. Bolívar, Res. Los Samanes, Apto 4B', 'Fiebre recurrente, cefalea intensa y dolor muscular', '2026-10-15'),
('V-19827364', 'Elena', 'Rivas', 'Calle 5 de Julio, Casa #12, Miranda', 'Hipertensión arterial, mareos leves matutinos', '2026-10-17'),
('V-30112459', 'Marcos', 'Silva', 'Urb. El Rosal, Torre B, Piso 2', 'Tos seca persistente y dificultad respiratoria leve', '2026-10-18')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- Nota: Al iniciar el servidor Node.js por primera vez, el usuario administrador
-- ("admin" con contraseña "admin") se inicializa de forma automática en la tabla `usuarios`
-- usando bcrypt y la librería mysql-tab.
