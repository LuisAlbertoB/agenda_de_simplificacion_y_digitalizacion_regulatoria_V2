-- ============================================================================
-- 1. MÓDULO DE SEGURIDAD Y CONTROL DE ACCESO (RBAC)
-- ============================================================================

CREATE TABLE roles (
    id_role INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(255) NOT NULL UNIQUE,
    nombre_oficial VARCHAR(255) NOT NULL,
    siglas VARCHAR(50),
    status BOOLEAN DEFAULT TRUE,
    created_by_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE permisos (
    id_permiso INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(255) NOT NULL UNIQUE,
    valor INT DEFAULT 0, -- 0 = sin-permisos, 1 = solo lectura, 2 = lectura-y-escritura, etc.
    created_by_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE roles_has_permisos (
    id_role_has_permiso INT AUTO_INCREMENT PRIMARY KEY,
    id_role INT NOT NULL,
    id_permiso INT NOT NULL,
    created_by_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_role) REFERENCES roles(id_role) ON DELETE CASCADE,
    FOREIGN KEY (id_permiso) REFERENCES permisos(id_permiso) ON DELETE CASCADE
);

CREATE TABLE dependencias (
    id_dependencia INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(255) NOT NULL UNIQUE,
    nombre_oficial VARCHAR(255) NOT NULL,
    siglas VARCHAR(50),
    titular_dependencia VARCHAR(255),
    ambito INT CHECK (ambito >= 0 AND ambito <= 4), -- 0: todos, 1: estatal, 2: municipal, 3: autónomo, 4: ninguno
    status BOOLEAN DEFAULT TRUE,
    created_by_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    curp VARCHAR(18) UNIQUE,
    llave_mx VARCHAR(255) NULL, -- Identificador logístico para futura integración
    password VARCHAR(255) NOT NULL, -- bcrypt
    correo_electronico VARCHAR(255) NOT NULL UNIQUE,
    nombres VARCHAR(255) NOT NULL,
    apellido1 VARCHAR(255) NOT NULL,
    apellido2 VARCHAR(255),
    cargo_oficial VARCHAR(255),
    is_oficial_link_person BOOLEAN DEFAULT FALSE,
    id_dependencia INT NOT NULL,
    id_role INT NOT NULL,
    status BOOLEAN DEFAULT TRUE,
    created_by_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_dependencia) REFERENCES dependencias(id_dependencia),
    FOREIGN KEY (id_role) REFERENCES roles(id_role)
);


-- ============================================================================
-- 2. MÓDULO DE TRÁMITES, SERVICIOS Y AGENDAS
-- ============================================================================

CREATE TABLE tramites_o_servicios (
    id_tramite_servicio INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(255) NOT NULL UNIQUE,
    nombre_oficial TEXT NOT NULL,
    descripcion TEXT,
    objetivo TEXT,
    tipo INT CHECK (tipo >= 0 AND tipo <= 4),
    tramite_o_servicio BOOLEAN, -- TRUE para trámite, FALSE para servicio
    created_by_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE agendas (
    id_agenda INT AUTO_INCREMENT PRIMARY KEY,
    id_dependencia INT NOT NULL,
    anio INT CHECK (anio >= 2020),
    semestre BOOLEAN, -- TRUE / FALSE para distinguir periodos
    unidad_administrativa VARCHAR(255),
    titular_unidad_admin VARCHAR(255),
    enlace_oficial_id INT,
    status INT DEFAULT 0 CHECK (status >= 0), -- 0: borrador, 1: revisión pendiente, etc.
    created_by_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_dependencia) REFERENCES dependencias(id_dependencia),
    FOREIGN KEY (enlace_oficial_id) REFERENCES usuarios(id_usuario)
);

CREATE TABLE fichas (
    id_ficha INT AUTO_INCREMENT PRIMARY KEY,
    id_agenda INT NOT NULL,
    id_tramite_servicio INT NOT NULL,
    
    -- Información General del Trámite o Servicio
    solicitud_tipo INT CHECK (solicitud_tipo >= 0 AND solicitud_tipo <= 3), -- 0: nueva apertura, 1: renovación, 2: modificación, 3: baja
    plazo_maximo_resolucion_dias INT CHECK (plazo_maximo_resolucion_dias >= 0),
    is_dia_habil_o_inhabil BOOLEAN, -- TRUE para hábiles, FALSE naturales
    vigencia_del_documento_obtenido VARCHAR(255),
    poblacion_prioritaria_atencion_preferente BOOLEAN, -- personas vulnerables
    solicitudes_recibidas_semestre_anterior INT CHECK (solicitudes_recibidas_semestre_anterior >= 0),
    resoluciones_positivas INT CHECK (resoluciones_positivas >= 0),
    areas_administrativas_interfieren INT CHECK (areas_administrativas_interfieren >= 0),
    condiciones_o_criterios_de_resolucion LONGTEXT,
    
    -- Diagnóstico Operativo y Medios de Atención (Canales Habilitados)
    habile_ventanilla_presencial BOOLEAN DEFAULT FALSE,
    habile_portal_web_municipal BOOLEAN DEFAULT FALSE,
    habile_app_mobile BOOLEAN DEFAULT FALSE,
    habile_linea_telefonica BOOLEAN DEFAULT FALSE,
    
    -- Análisis Operativo FASD 06 (Cuellos de botella)
    cuellos_de_botella LONGTEXT,
    requisitos_sin_valor LONGTEXT,
    propuestas_de_mejora LONGTEXT,
    
    -- Fundamentos Jurídicos y Esquema de Cobro
    regulacion_fundamenta_existencia_tramite TEXT,
    fundamento_en_ley_de_ingresos TEXT,
    
    -- Matriz de Diagnóstico y Nivel de Madurez Digital
    nivel_digitalizacion_actual INT CHECK (nivel_digitalizacion_actual >= 0 AND nivel_digitalizacion_actual <= 3), -- 0: presencial, 1: informativo, 2: interactivo parcial, 3: digital end-to-end
    propuesta_mejora_transaccion_tecnologica LONGTEXT,
    
    -- Estado General de la Ficha
    status INT DEFAULT 0 CHECK (status >= 0), -- 0: borrador, 1: revisión pendiente, etc.
    
    created_by_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_agenda) REFERENCES agendas(id_agenda) ON DELETE CASCADE,
    FOREIGN KEY (id_tramite_servicio) REFERENCES tramites_o_servicios(id_tramite_servicio)
);

CREATE TABLE cobros (
    id_cobros INT AUTO_INCREMENT PRIMARY KEY,
    id_ficha INT NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    unidad_medida VARCHAR(100), -- ej. UMA, MXN
    importe FLOAT CHECK (importe >= 0),
    forma_pago VARCHAR(255),
    created_by_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ficha) REFERENCES fichas(id_ficha) ON DELETE CASCADE
);


-- ============================================================================
-- 3. MÓDULO DE ACCIONES, ACTIVIDADES, ENTREGABLES Y CRONOGRAMAS
-- ============================================================================

CREATE TABLE acciones (
    id_accion INT AUTO_INCREMENT PRIMARY KEY,
    simplificacion_o_digitalizacion BOOLEAN, -- TRUE para simplificación, FALSE para digitalización
    clave VARCHAR(50) NOT NULL UNIQUE,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    created_by_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE actividades (
    id_actividades INT AUTO_INCREMENT PRIMARY KEY,
    id_accion INT NOT NULL,
    clave VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    created_by_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_accion) REFERENCES acciones(id_accion) ON DELETE CASCADE
);

CREATE TABLE entregables (
    id_entregable INT AUTO_INCREMENT PRIMARY KEY,
    id_actividad INT NOT NULL,
    clave VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    status BOOLEAN DEFAULT FALSE,
    created_by_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_actividad) REFERENCES actividades(id_actividades) ON DELETE CASCADE
);

CREATE TABLE fichas_has_acciones (
    id_fichas_has_accion INT AUTO_INCREMENT PRIMARY KEY,
    id_ficha INT NOT NULL,
    id_accion INT NOT NULL,
    created_by_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ficha) REFERENCES fichas(id_ficha) ON DELETE CASCADE,
    FOREIGN KEY (id_accion) REFERENCES acciones(id_accion) ON DELETE CASCADE
);

-- Actualización Sprint 5 (2026-09-21): El cronograma pasa de nivel acción a nivel actividad.
-- Se reemplaza id_accion por id_actividad FK a la tabla actividades(id_actividades).
CREATE TABLE cronograma_de_actividades_por_ficha (
    id_cronograma INT AUTO_INCREMENT PRIMARY KEY,
    id_ficha INT NOT NULL,
    id_actividad INT NOT NULL,
    num_mes_inicio_plazo INT CHECK (num_mes_inicio_plazo >= 0 AND num_mes_inicio_plazo <= 6),
    num_mes_final_plazo INT CHECK (num_mes_final_plazo >= 0 AND num_mes_final_plazo <= 6),
    created_by_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ficha) REFERENCES fichas(id_ficha) ON DELETE CASCADE,
    FOREIGN KEY (id_actividad) REFERENCES actividades(id_actividades) ON DELETE CASCADE
);