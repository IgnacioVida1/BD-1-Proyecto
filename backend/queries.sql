DROP TABLE IF EXISTS Busqueda CASCADE;
DROP TABLE IF EXISTS Revision CASCADE;
DROP TABLE IF EXISTS Material CASCADE;
DROP TABLE IF EXISTS Curso CASCADE;
DROP TABLE IF EXISTS Administrador CASCADE;
DROP TABLE IF EXISTS Asistente CASCADE;
DROP TABLE IF EXISTS Usuario CASCADE;
DROP TABLE IF EXISTS Persona CASCADE;

-- Tabla Persona
CREATE TABLE IF NOT EXISTS Persona (
    Id SERIAL PRIMARY KEY,
    Genero CHAR(1) CHECK (Genero IN ('M', 'F', 'O', NULL)),
    FechaCreacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Email VARCHAR(255) NOT NULL UNIQUE CHECK (Email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
    NombreUsuario VARCHAR(50) NOT NULL UNIQUE,
    Contraseña VARCHAR(255) NOT NULL
);

-- Subtipos de Persona
CREATE TABLE IF NOT EXISTS Usuario (
    Id INTEGER PRIMARY KEY REFERENCES Persona(Id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Asistente (
    Id INTEGER PRIMARY KEY REFERENCES Persona(Id) ON DELETE CASCADE,
    CantidadPropuestas INTEGER NOT NULL DEFAULT 0 CHECK (CantidadPropuestas >= 0)
);

CREATE TABLE IF NOT EXISTS Administrador (
    Id INTEGER PRIMARY KEY REFERENCES Persona(Id) ON DELETE CASCADE,
    CantidadAprobaciones INTEGER NOT NULL DEFAULT 0 CHECK (CantidadAprobaciones >= 0),
    CantidadPropuestas INTEGER NOT NULL DEFAULT 0 CHECK (CantidadPropuestas >= 0)
);

-- Tabla Curso
CREATE TABLE IF NOT EXISTS Curso (
    IdCurso SERIAL PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL UNIQUE,
    Descripcion TEXT,
    AprobacionesRequeridas INTEGER NOT NULL DEFAULT 5 CHECK (AprobacionesRequeridas > 0)
);

-- Tabla Material
CREATE TABLE IF NOT EXISTS Material (
    IdMaterial SERIAL PRIMARY KEY,
    Titulo VARCHAR(255) NOT NULL UNIQUE,
    Estado VARCHAR(20) NOT NULL CHECK (Estado IN ('Pendiente', 'Aprobado', 'Rechazado'))
      DEFAULT 'Pendiente',
    Descripcion TEXT,
    TipoArchivo VARCHAR(50) NOT NULL,
    UrlArchivo VARCHAR(255) NOT NULL UNIQUE,
    FechaSubida TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FechaPublicacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    AprobacionesRecibidas INTEGER NOT NULL DEFAULT 0 CHECK (AprobacionesRecibidas >= 0),
    IdCurso INTEGER REFERENCES Curso(IdCurso) ON DELETE SET NULL
);

-- Tabla Revisión
CREATE TABLE IF NOT EXISTS Revision (
    IdRevision SERIAL PRIMARY KEY,
    IdPersonaPropone INTEGER NOT NULL REFERENCES Persona(Id) ON DELETE CASCADE,
    IdPersonaAprueba INTEGER REFERENCES Persona(Id) ON DELETE SET NULL,
    IdMaterial INTEGER NOT NULL REFERENCES Material(IdMaterial) ON DELETE CASCADE,
    FechaCreacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Accion VARCHAR(20) NOT NULL CHECK (Accion IN ('Aprobar', 'Rechazar', 'Sugerir')),
    Comentario TEXT,
    CONSTRAINT chk_aprobador_diferente_proponente CHECK (IdPersonaPropone != IdPersonaAprueba OR IdPersonaAprueba IS NULL)
);

-- Tabla Busqueda
CREATE TABLE IF NOT EXISTS Busqueda (
    IdBusqueda SERIAL PRIMARY KEY,
    IdPersona INTEGER NOT NULL REFERENCES Persona(Id) ON DELETE CASCADE,
    TextoBuscado TEXT NOT NULL,
    FechaBusqueda TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 1. Inserts para Persona (20 registros)
INSERT INTO Persona (Genero, Email, NombreUsuario, Contraseña) VALUES
('M', 'juan.perez@example.com', 'juanperez', 'hashed123'),
('F', 'maria.garcia@example.com', 'mariag', 'hashed456'),
('O', 'alex.smith@example.com', 'alexsmith', 'hashed789'),
('M', 'carlos.lopez@example.com', 'carlosl', 'hashed101'),
('F', 'laura.martinez@example.com', 'lauram', 'hashed112'),
('M', 'pedro.rodriguez@example.com', 'pedror', 'hashed131'),
('F', 'sofia.hernandez@example.com', 'sofiah', 'hashed415'),
('M', 'david.gomez@example.com', 'davidg', 'hashed161'),
('F', 'ana.torres@example.com', 'anator', 'hashed718'),
('O', 'luis.diaz@example.com', 'luisd', 'hashed191'),
('M', 'jorge.flores@example.com', 'jorgef', 'hashed202'),
('F', 'patricia.vargas@example.com', 'patriciav', 'hashed213'),
('M', 'eduardo.castro@example.com', 'eduardoc', 'hashed424'),
('F', 'claudia.ruiz@example.com', 'claudiar', 'hashed252'),
('O', 'roberto.morales@example.com', 'robertom', 'hashed262'),
('M', 'fernando.ortiz@example.com', 'fernandoo', 'hashed728'),
('F', 'isabel.silva@example.com', 'isabels', 'hashed292'),
('M', 'gustavo.mendoza@example.com', 'gustavom', 'hashed303'),
('F', 'elena.guzman@example.com', 'elenag', 'hashed313'),
('O', 'ricardo.rios@example.com', 'ricardor', 'hashed324');

-- 2. Inserts para Usuario (20 registros)
INSERT INTO Usuario (Id) VALUES
(1), (2), (3), (4), (5), (6), (7), (8);

-- 3. Inserts para Asistente (20 registros)
INSERT INTO Asistente (Id, CantidadPropuestas) VALUES
(9, 5), (10, 5), (11, 5), (12, 0), (13, 2), (14, 5), (15, 8),
(16, 4);

-- 4. Inserts para Administrador (20 registros)
INSERT INTO Administrador (Id, CantidadAprobaciones, CantidadPropuestas) VALUES
(17, 15, 3), (18, 15, 3), (19, 15, 3), (20, 15, 3);

-- 5. Inserts para Curso (20 registros)
INSERT INTO Curso (Nombre, Descripcion, AprobacionesRequeridas) VALUES
('Matemáticas Básicas', 'Curso introductorio de matemáticas', 5),
('Programación en Python', 'Aprende Python desde cero', 3),
('Diseño Gráfico', 'Fundamentos de diseño con Adobe Illustrator', 4),
('Inglés Avanzado', 'Curso de inglés nivel C1', 6),
('Machine Learning', 'Introducción a ML con scikit-learn', 7),
('Finanzas Personales', 'Gestión de finanzas para principiantes', 3),
('Fotografía Digital', 'Técnicas de fotografía profesional', 4),
('Desarrollo Web', 'HTML, CSS y JavaScript', 5),
('Marketing Digital', 'Estrategias de marketing online', 6),
('Bases de Datos SQL', 'SQL y PostgreSQL', 4),
('Inteligencia Artificial', 'Conceptos básicos de IA', 7),
('Redes Informáticas', 'Fundamentos de networking', 5),
('Derecho Laboral', 'Leyes y regulaciones laborales', 3),
('Arquitectura de Software', 'Patrones y buenas prácticas', 6),
('Ciberseguridad', 'Protección contra amenazas digitales', 7),
('Robótica', 'Introducción a la robótica con Arduino', 4),
('Psicología Organizacional', 'Comportamiento en entornos laborales', 3),
('Blockchain', 'Tecnología de cadenas de bloques', 5),
('Nutrición', 'Alimentación saludable', 4),
('Historia del Arte', 'Movimientos artísticos del siglo XX', 3);

-- 6. Inserts para Material (20 registros)
INSERT INTO Material (Titulo, Estado, Descripcion, TipoArchivo, UrlArchivo, AprobacionesRecibidas, IdCurso) VALUES
('Apuntes de Álgebra', 'Aprobado', 'Conceptos básicos de álgebra', 'PDF', 'http://example.com/algebra.pdf', 5, 1),
('Ejercicios de Python', 'Aprobado', '50 ejercicios resueltos', 'ZIP', 'http://example.com/python.zip', 5, 1),
('Guía de Diseño', 'Aprobado', 'Teoría del color y tipografía', 'PDF', 'http://example.com/diseno.pdf', 6, 3),
('Vocabulario Inglés', 'Rechazado', 'Lista de 500 palabras', 'DOCX', 'http://example.com/ingles.docx', 1, 4),
('Dataset para ML', 'Aprobado', 'Dataset limpio para entrenamiento', 'CSV', 'http://example.com/ml.csv', 8, 5),
('Plantilla de Presupuesto', 'Aprobado', 'Excel para finanzas', 'XLSX', 'http://example.com/finanzas.xlsx', 5, 1),
('Fotos de Ejemplo', 'Aprobado', 'Galería de técnicas fotográficas', 'JPG', 'http://example.com/fotos.jpg', 7, 7),
('Código Frontend', 'Aprobado', 'Ejemplos de HTML/CSS', 'ZIP', 'http://example.com/frontend.zip', 5, 8),
('Estrategias SEO', 'Aprobado', 'Guía de posicionamiento web', 'PDF', 'http://example.com/seo.pdf', 5, 1),
('Ejemplos SQL', 'Aprobado', 'Queries avanzadas', 'SQL', 'http://example.com/sql.sql', 6, 10),
('Paper sobre IA', 'Rechazado', 'Investigación reciente', 'PDF', 'http://example.com/ia.pdf', 2, 11),
('Manual de Redes', 'Aprobado', 'Configuración de routers', 'PDF', 'http://example.com/redes.pdf', 5, 12),
('Leyes Laborales', 'Aprobado', 'Actualización 2023', 'DOCX', 'http://example.com/leyes.docx', 5, 1),
('Diagramas UML', 'Pendiente', 'Patrones de diseño', 'PNG', 'http://example.com/uml.png', 7, 1),
('Guía de Seguridad', 'Aprobado', 'Protección de datos', 'PDF', 'http://example.com/seguridad.pdf', 9, 15),
('Código Arduino', 'Aprobado', 'Ejemplos básicos', 'INO', 'http://example.com/arduino.ino', 5, 16),
('Test Psicológico', 'Rechazado', 'Cuestionario organizacional', 'PDF', 'http://example.com/test.pdf', 1, 17),
('Smart Contracts', 'Aprobado', 'Ejemplos en Solidity', 'SOL', 'http://example.com/smart.sol', 6, 18),
('Recetas Saludables', 'Aprobado', 'Platos balanceados', 'PDF', 'http://example.com/recetas.pdf', 5, 19),
('Galería de Arte', 'Aprobado', 'Obras representativas', 'JPG', 'http://example.com/arte.jpg', 5, 20);

-- 7. Inserts para Revision (20 registros)
INSERT INTO Revision (IdPersonaPropone, IdPersonaAprueba, IdMaterial, Accion, Comentario) VALUES
(9, 17, 1, 'Aprobar', 'Excelente contenido'),
(10, 18, 2, 'Aprobar', 'Muy buenos ejercicios'),
(11, 19, 3, 'Aprobar', 'Guía completa'),
(13, 20, 5, 'Aprobar', 'Dataset útil'),
(9, 18, 6, 'Aprobar', 'Plantilla bien diseñada'),
(10, 19, 7, 'Aprobar', 'Fotos profesionales'),
(11, 20, 8, 'Aprobar', 'Código limpio'),
(13, 17, 9, 'Aprobar', 'SEO actualizado'),
(15, 18, 10, 'Aprobar', 'Buenos ejemplos'),
(16, 19, 12, 'Aprobar', 'Manual detallado'),

-- Revisiones cruzadas adicionales (15 registros)
(9, 18, 15, 'Aprobar', 'Guía esencial'),
(10, 19, 18, 'Aprobar', 'Contratos bien escritos'),
(11, 20, 20, 'Aprobar', 'Arte de calidad'),
(12, 17, 1, 'Aprobar', 'Re-aprobación'),
(13, 18, 3, 'Aprobar', 'Segunda opinión'),
(14, 19, 5, 'Aprobar', 'Buen dataset'),
(15, 20, 7, 'Aprobar', 'Nueva aprobación'),
(16, 17, 9, 'Aprobar', 'Revisión final'),
(9, 19, 12, 'Aprobar', 'Última revisión'),
(10, 20, 15, 'Aprobar', 'Aprobado por equipo'),
(11, 17, 18, 'Aprobar', 'Verificado'),
(12, 18, 20, 'Aprobar', 'Consenso equipo'),
(13, 19, 2, 'Aprobar', 'Todos de acuerdo'),
(14, 20, 6, 'Aprobar', 'Aprobación unánime'),
(15, 17, 10, 'Aprobar', 'OK para publicar');

-- 8. Inserts para Busqueda (20 registros)
INSERT INTO Busqueda (IdPersona, TextoBuscado) VALUES
(1, 'Ejercicios de Python'),
(2, 'Cursos de diseño gráfico'),
(3, 'Cómo aprender SQL'),
(4, 'Tutoriales de fotografía'),
(5, 'Libros de machine learning'),
(6, 'Herramientas de marketing digital'),
(7, 'Códigos Arduino para principiantes'),
(8, 'Guías de ciberseguridad'),
(9, 'Plantillas de Excel financieras'),
(10, 'Teoría del color'),
(11, 'Patrones de diseño de software'),
(12, 'Leyes laborales actuales'),
(13, 'Robótica educativa'),
(14, 'Blockchain para dummies'),
(15, 'Nutrición deportiva'),
(16, 'Historia del arte moderno'),
(17, 'Redes Cisco CCNA'),
(18, 'Inglés técnico para TI'),
(19, 'Matemáticas discretas'),
(20, 'Psicología del trabajo');

CREATE OR REPLACE FUNCTION procesar_aprobacion_material()  
RETURNS TRIGGER AS $$ DECLARE  
aprobaciones_actuales INTEGER; aprobaciones_necesarias INTEGER;  
BEGIN  
IF NEW.Accion != 'Aprobar' THEN RETURN NEW; END IF; 
SELECT COUNT(DISTINCT r.IdPersonaAprueba) INTO aprobaciones_actuales 
FROM Revision r 
WHERE r.IdMaterial = NEW.IdMaterial 
AND r.Accion = 'Aprobar' 
AND r.FechaCreacion >= (NOW() - INTERVAL '7 days'); 
 
SELECT c.AprobacionesRequeridas INTO aprobaciones_necesarias 
FROM Curso c 
JOIN Material m ON c.IdCurso = m.IdCurso 
WHERE m.IdMaterial = NEW.IdMaterial; 
 
UPDATE Material  
SET AprobacionesRecibidas = aprobaciones_actuales 
WHERE IdMaterial = NEW.IdMaterial; 
 
IF aprobaciones_actuales >= COALESCE(aprobaciones_necesarias, 5) THEN 
    UPDATE Material  
    SET  
        Estado = 'Aprobado', 
        FechaPublicacion = NOW() 
    WHERE IdMaterial = NEW.IdMaterial; 
END IF; 
 
RETURN NEW; 
 
END; $$ LANGUAGE plpgsql; 

CREATE TRIGGER trg_procesar_aprobacion  
AFTER INSERT ON Revision  
FOR EACH ROW EXECUTE FUNCTION procesar_aprobacion_material();

CREATE OR REPLACE FUNCTION actualizar_contadores_persona()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.Accion = 'Sugerir' THEN
        UPDATE Asistente 
        SET CantidadPropuestas = CantidadPropuestas + 1 
        WHERE Id = NEW.IdPersonaPropone;

        UPDATE Administrador 
        SET CantidadPropuestas = CantidadPropuestas + 1 
        WHERE Id = NEW.IdPersonaPropone;
    END IF;

    IF NEW.Accion = 'Aprobar' AND NEW.IdPersonaAprueba IS NOT NULL THEN
        UPDATE Administrador 
        SET CantidadAprobaciones = CantidadAprobaciones + 1 
        WHERE Id = NEW.IdPersonaAprueba;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_contadores
AFTER INSERT ON Revision
FOR EACH ROW
EXECUTE FUNCTION actualizar_contadores_persona();
