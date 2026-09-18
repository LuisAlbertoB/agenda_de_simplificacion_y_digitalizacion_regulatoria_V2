# Cliente Web GovTech Tuxtla Digital (Sprint 3)

Cliente web estático de la **Agenda de Simplificación y Digitalización Regulatoria** (FASD 2026), construido para el H. Ayuntamiento de Tuxtla Gutiérrez, Chiapas.

En el **Sprint 3** se activó la **Capa B (CRUD Completo con Formularios/Modales de Escritura)** para las 14 entidades del sistema:
- Formularios modales dinámicos (`showFormModal`) con captura, edición, eliminación (`showConfirmModal`) y notificaciones (`showToast`).
- Formulario de gestión de usuarios con alta obligatoria de contraseña (Bcrypt) y edición con contraseña opcional sin exponer hashes en las respuestas.
- Formulario de cambio de estado de agenda (5 estados: Borrador, Enviada, Aprobada, Observada, Rechazada) vía `PATCH /api/agendas/{id}/cambiar-estado/` con confirmación para transiciones irreversibles.
- Formulario de captura completa de ficha diagnóstica, con subsecciones para vincular acciones (`fichas_has_acciones`) y calendarización (`cronograma_de_actividades_por_ficha`).
- Widget de Puntaje de Priorización (FASD 01) en la matriz diagnóstica, mostrando el puntaje parcial (hasta 90 pts) y la lista de factores no evaluados en el canon.
- Vista de solo lectura para el catálogo de las 11 Acciones LNETB sembradas por el comando de gestión backend, distinguiendo Simplificación vs Digitalización.
- Muestreo en el Centro de Emisión Documental del catálogo de los 9 documentos FASD preparados para el siguiente sprint.

---

## Decisión de Arquitectura

- **Tecnología Principal**: JavaScript Vanilla nativo con módulos ES6 (`<script type="module" src="./js/app.js">`), sin framework (React/Vue) y sin bundler/build step (Vite/Webpack), garantizando cero sobrecarga de compilación y máxima mantenibilidad.
- **Sistema de Diseño y Estilos**: Tailwind CSS servido vía CDN (`https://cdn.tailwindcss.com`), con configuración dinámica `tailwind.config` inyectando los tokens exactos del archivo de especificación oficial `doc/sketch/govtech_tuxtla_digital/DESIGN.md` (paleta tonal de alto contraste en modo oscuro, tipografía institucional Google Fonts Outfit / Plus Jakarta Sans / Inter, radios e hiper-espaciado determinista).
- **Tipografía e Iconografía**:
  - Headings & KPI Digits: *Outfit*
  - UI Prose & Section Titles: *Plus Jakarta Sans*
  - Form Inputs, Labels & Data Tables: *Inter*
  - Iconos: *Material Symbols Outlined*
- **Capa de Datos**: Servicios HTTP modularizados mediante `services/api.js` y `services/crud-factory.js`. Autenticación persistente con JWT, refresco automático de token en error 401 y consumo completo de la API REST DRF (`list`, `getById`, `create`, `update`, `partialUpdate`, `remove`).
- **Navegación**: Enrutador propio hash-based (`#/`, `#/login`, etc.) con protección de rutas privadas y renderizado reactivo del shell institucional.

---

## Cómo Levantar el Cliente en Desarrollo

Este es un proyecto 100% estático. Para probarlo y consumirlo con el servidor Django en ejecucion:

### Si estás parado en la raíz del repositorio (`.../agenda_de_simplificacion_y_digitalizacion_regulatoria_V2`):
```bash
# Con Python:
python3 -m http.server 5173 --directory client

# O con npx serve:
npx serve client -l 5173
```

### Si estás parado DENTRO de la carpeta `/client` (`.../agenda_de_simplificacion_y_digitalizacion_regulatoria_V2/client`):
```bash
# Con Python:
python3 -m http.server 5173

# O con npx serve (usa . en lugar de client):
npx serve . -l 5173
```

El servidor Django (`/server`) ya permite solicitudes CORS desde `http://localhost:5173` y `http://localhost:3000`. Accede a `http://localhost:5173` en tu navegador.

---

## Listo para el Siguiente Sprint: Exportación Documental

El cliente web cuenta con la pantalla **Centro de Emisión y Exportación Documental** (`emision-documental-page.js`) actualizada para presentar al usuario final el catálogo completo de los 9 documentos normados por la LNETB (FASD 01–06 + Agendas consolidadas + Archivo ZIP Maestro) que podrán generarse y descargarse en el siguiente sprint.

