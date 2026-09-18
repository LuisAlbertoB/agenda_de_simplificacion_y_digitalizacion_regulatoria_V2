# Agenda de Simplificación y Digitalización Regulatoria — Backend (Sprint 3)

Servidor backend desarrollado en **Python 3.12+**, **Django 5.1** y **Django REST Framework (DRF)**. Proporciona una arquitectura RESTful estructurada en 4 capas (Modelos, Serializadores/Servicios, Controladores, Rutas) para gestionar la agenda gubernamental de simplificación y digitalización regulatoria.

En el **Sprint 3** se incorporó la lógica de negocio completa del sistema predecesor adaptada al modelo canónico:
- Validaciones de unicidad de aplicación (agenda única por dependencia/año/semestre, ficha única por agenda/trámite, claves únicas amigables).
- Manejo amigable de errores de borrado protegido (`ProtectedError` -> 400 Bad Request en catálogos).
- Validaciones de coherencia de datos (`resoluciones_positivas <= solicitudes_recibidas`, `num_mes_final_plazo >= num_mes_inicio_plazo`).
- Transición controlada del estado de agendas (`agendas.status` con 5 estados: 0=Borrador, 1=Enviada, 2=Aprobada, 3=Observada, 4=Rechazada) vía `PATCH /api/agendas/{id}/cambiar-estado/`.
- Regla de propiedad por dependencia en agendas (para usuarios que no sean administradores).
- Gestión segura de usuarios (alta obligatoria con Bcrypt, edición con contraseña opcional sin exponer hashes).
- Comando de gestión `python manage.py seed_acciones` para sembrar idempotentemente las 11 Acciones LNETB.
- Algoritmo de priorización de trámites (FASD 01) parcial via `FichaService.calcular_puntaje_priorizacion` y endpoint `GET /api/fichas/{id}/priorizacion/`.

---

## 🏛️ Arquitectura del Proyecto

El proyecto sigue una arquitectura desacoplada por capas basada en las convenciones del boilerplate del sistema:

```
server/
├── db_config/             # Configuración de entornos (.env, .env.example)
├── manage.py              # Punto de entrada administrativo Django
├── requirements.txt       # Dependencias del proyecto
├── postman/               # Colección Postman para pruebas de API
│   └── postman_collection.json
├── test/                  # Suite de pruebas automatizadas
│   ├── test_endpoints.py
│   └── test_business_logic.py
└── src/                   # Aplicación principal
    ├── models/            # 14 modelos ORM (fieles a script.sql)
    ├── services/          # Serializadores DRF + Capa de Lógica de Negocio (Service Layer)
    ├── controllers/       # ViewSets y vistas JWT
    ├── routes/            # Configuración de URLs y Routers REST
    ├── middlewares/       # Manejador global de excepciones (ProtectedError) y permisos
    ├── management/        # Comandos CLI personalizados (seed_acciones, seed_rbac, etc.)
    ├── admin.py           # Registro en el Panel de Administración Django
    ├── settings.py        # Configuración principal de Django y JWT
    ├── urls.py            # Rutas principales del servidor
    ├── wsgi.py            # Entrada WSGI para producción
    └── asgi.py            # Entrada ASGI para desarrollo/servidor asíncrono
```

---

## 🚀 Próximo sprint: exportación documental

El backend ha quedado 100% preparado arquitectónicamente para el siguiente sprint dedicado a la **generación y exportación de documentos oficiales FASD (01–06) y paquetes comprimidos (.ZIP)**:

### Catálogo de Documentos FASD Preparados:
1. **FASD 01 (Priorización de Trámites o Servicios)**: Se alimentará de `Ficha` y la función pura `FichaService.calcular_puntaje_priorizacion(ficha)`.
2. **FASD 02 (Ficha Técnica del Análisis a Simplificar)**: Se alimentará de `Ficha` y `TramiteOServicio` (datos generales, fundamentación jurídica).
3. **FASD 03 (Acciones de Simplificación y Digitalización)**: Se alimentará de `FichaHasAccion` y `Accion`.
4. **FASD 04 (Cronología de Integración — Simplificación)**: Se alimentará de `CronogramaActividad` filtrando acciones de tipo simplificación.
5. **FASD 05 (Cronología de Integración — Digitalización)**: Se alimentará de `CronogramaActividad` filtrando acciones de tipo digitalización.
6. **FASD 06 (Diagnóstico del Trámite o Servicio)**: Se alimentará de los campos de cuellos de botella, requisitos sin valor y nivel de madurez digital en `Ficha`.
7. **Agenda de Simplificación (Agregado)**: Consolidado de documentos FASD 03/04 de todas las fichas de una agenda.
8. **Agenda de Digitalización (Agregado)**: Consolidado de documentos FASD 03/05 de todas las fichas de una agenda.
9. **Agenda Completa / Maestro (ZIP)**: Archivo comprimido `.zip` con la compilación oficial de todos los PDF emitidos.

> [!NOTE]
> En este Sprint 3 no se agregaron librerías de PDF al `requirements.txt` ni endpoints de descarga funcional para mantener el alcance limpio y modular.

---

## 🧪 Pruebas Automatizadas

Para ejecutar la suite completa de pruebas unitarias y de integración de lógica de negocio:

```bash
python manage.py test --verbosity=2
```

---

## 📊 Modelo de Datos (14 Entidades)

El sistema mapea las 14 tablas relacionales definidas en la especificación formal del modelo relacional (`script.sql`):

### Módulo 1: RBAC y Estructura Organizacional
1. **`roles`** (`Role`): Catálogo de roles del sistema.
2. **`permisos`** (`Permiso`): Catálogo de permisos asignables (valor 0=ninguno, 1=lectura, 2=escritura).
3. **`roles_has_permisos`** (`RoleHasPermiso`): Relación N:M entre roles y permisos.
4. **`dependencias`** (`Dependencia`): Entidades gubernamentales emisoras (ámbito 0=todos, 1=estatal, 2=municipal, 3=autónomo, 4=ninguno).
5. **`usuarios`** (`Usuario` - `AUTH_USER_MODEL`): Modelo de usuario del sistema con autenticación JWT por correo electrónico y contraseñas Bcrypt.

### Módulo 2: Trámites y Agendas
6. **`tramites_o_servicios`** (`TramiteOServicio`): Catálogo de trámites o servicios regulados.
7. **`agendas`** (`Agenda`): Agenda semestral/anual por dependencia.
8. **`fichas`** (`Ficha`): Diagnóstico detallado y propuesta de digitalización del trámite.
9. **`cobros`** (`Cobro`): Conceptos e importes asociados a las fichas.

### Módulo 3: Acciones, Actividades y Cronogramas
10. **`acciones`** (`Accion`): Acciones de simplificación o digitalización.
11. **`actividades`** (`Actividad`): Actividades concretas de cada acción (`id_actividades` PK).
12. **`entregables`** (`Entregable`): Entregables verificables por actividad.
13. **`fichas_has_acciones`** (`FichaHasAccion`): Relación N:M entre fichas y acciones.
14. **`cronograma_de_actividades_por_ficha`** (`CronogramaActividad`): Cronograma de ejecución por meses (0-6).

---

## 🚀 Instalación y Configuración

### 1. Entorno Virtual e Instalación de Dependencias

```bash
cd server

# Crear entorno virtual
python3 -m venv venv

# Activar entorno virtual
source venv/bin/activate  # En Linux/macOS
# venv\Scripts\activate   # En Windows

# Instalar dependencias
pip install -r requirements.txt
```

### 2. Configuración del Archivo de Entorno (`.env`)

Copiar el archivo de ejemplo y configurar las credenciales locales:

```bash
cp db_config/.env.example db_config/.env
```

Edita `db_config/.env` para ajustar la clave secreta o seleccionar entre SQLite (por defecto) o PostgreSQL.

---

## 💾 Migraciones y Sembrado de Datos (Seed)

### Ejecutar Migraciones

```bash
python manage.py makemigrations src
python manage.py migrate
```

### Sembrar Datos Iniciales (Roles, Permisos, Dependencia y Superusuario Admin)

```bash
python manage.py seed_rbac
```

El comando creará por defecto el usuario administrador inicial:
- **Correo**: `admin@gob.mx`
- **Contraseña**: `Admin123456!`

### Otros Comandos Útiles

```bash
# Crear un rol específico
python manage.py create_role --clave ATENCION --nombre "Atención Ciudadana"

# Crear un permiso específico
python manage.py create_permiso --clave FICHAS_APPROVE --valor 2

# Crear un superusuario
python manage.py create_superuser --correo admin2@gob.mx --password MiPassword123!
```

---

## ⚙️ Ejecución del Servidor

### 🛠️ Modo Desarrollo (Dev)

1. **Asegúrate de que la configuración en `db_config/.env` esté en modo desarrollo:**
   ```ini
   DEBUG=True
   DB_ENGINE=sqlite  # o postgresql si usas una BD local
   ```

2. **Iniciar el servidor de desarrollo de Django:**
   ```bash
   python manage.py runserver
   ```
   *El servidor estará accesible en `http://127.0.0.1:8000/api/` con recarga automática al realizar cambios en el código.*

   Si deseas exponerlo en la red local u otro puerto:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

---

### 🏭 Modo Producción (Prod)

1. **Ajustar el archivo `db_config/.env` con credenciales de producción:**
   ```ini
   DEBUG=False
   SECRET_KEY=tu_clave_secreta_super_segura_y_aleatoria
   ALLOWED_HOSTS=midominio.gob.mx,127.0.0.1,localhost
   DB_ENGINE=postgresql
   DB_NAME=agenda_regulatoria_db
   DB_USER=postgres_user
   DB_PASSWORD=password_seguro
   DB_HOST=localhost_o_ip_bd
   DB_PORT=5432
   CORS_ALLOWED_ORIGINS=https://midominio.gob.mx
   ```

2. **Recolectar archivos estáticos para el Panel de Administración:**
   ```bash
   python manage.py collectstatic --noinput
   ```

3. **Ejecutar con servidor WSGI (Gunicorn):**
   ```bash
   pip install gunicorn
   gunicorn src.wsgi:application --bind 0.0.0.0:8000 --workers 4
   ```

4. **Ejecutar con servidor ASGI (Uvicorn):**
   ```bash
   pip install uvicorn
   uvicorn src.asgi:application --host 0.0.0.0 --port 8000 --workers 4
   ```

> [!NOTE]
> En despliegues reales de producción, se recomienda configurar **Nginx** o **Apache** como Proxy Inverso delante de Gunicorn/Uvicorn y administrar el proceso mediante **systemd** o contenedores **Docker**.

---

## 🧪 Pruebas Automatizadas

Para ejecutar la suite completa de pruebas unitarias y de integración de endpoints:

```bash
python manage.py test --verbosity=2
```

---

## 🌐 Endpoints de la API REST

Base URL en desarrollo local: `http://127.0.0.1:8000/api/`

| Recurso | Método HTTP | Descripción |
|---|---|---|
| `/api/token/` | `POST` | Obtener token de acceso JWT y token de refresco |
| `/api/token/refresh/` | `POST` | Refrescar token de acceso JWT |
| `/api/roles/` | `GET`, `POST` | Listar y crear roles |
| `/api/permisos/` | `GET`, `POST` | Listar y crear permisos |
| `/api/roles-has-permisos/` | `GET`, `POST` | Asignar permisos a roles |
| `/api/dependencias/` | `GET`, `POST` | Listar y crear dependencias |
| `/api/usuarios/` | `GET`, `POST` | Listar y registrar usuarios |
| `/api/tramites-o-servicios/` | `GET`, `POST` | Catálogo de trámites o servicios |
| `/api/agendas/` | `GET`, `POST` | Agendas de simplificación |
| `/api/fichas/` | `GET`, `POST` | Fichas de diagnóstico |
| `/api/cobros/` | `GET`, `POST` | Conceptos de cobro |
| `/api/acciones/` | `GET`, `POST` | Acciones de simplificación |
| `/api/actividades/` | `GET`, `POST` | Actividades por acción |
| `/api/entregables/` | `GET`, `POST` | Entregables de actividades |
| `/api/fichas-has-acciones/` | `GET`, `POST` | Vinculación ficha-acción |
| `/api/cronograma/` | `GET`, `POST` | Cronograma de plazos |

Todos los endpoints (salvo `/api/token/`) requieren la cabecera HTTP:
`Authorization: Bearer <access_token>`

---

## 📬 Postman

La colección de Postman preconfigurada se encuentra en `postman/postman_collection.json`.
1. Importa el archivo en Postman.
2. Ejecuta la petición **Auth -> Obtener Token JWT (Login)** para obtener automáticamente el token de autenticación.
3. El token se almacenará en la variable del entorno `{{access_token}}` y se aplicará automáticamente a todas las demás peticiones.
