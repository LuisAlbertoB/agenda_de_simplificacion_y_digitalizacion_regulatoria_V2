# Lógica de negocio heredada del predecesor (microservicio01) — adaptada al modelo canónico actual

## Propósito de este documento

Este documento **no es código**: es la lógica de negocio real observada en un sistema predecesor (`microservicio01_simplificacion_digitalizacion`, FastAPI + SQLAlchemy + SQLite), rescatada y **adaptada explícitamente** al modelo de datos actual del proyecto (`doc/diag/entity_relationship/v1/script.sql`, 14 entidades), que es el **canon** y **no debe modificarse**.

El predecesor tenía un modelo de datos más grande (15 tablas, con catálogos y sub-entidades que el canon actual no tiene). Donde el predecesor tenía una regla que **sí es portable** al canon (misma idea, campos equivalentes), se documenta lista para implementar. Donde el predecesor tenía una regla que **no es portable** porque el canon carece del campo o la tabla necesaria, se documenta como **limitación explícita**, no como algo a implementar — no se debe inventar ni agregar columnas nuevas para forzarla.

Este documento fue escrito para que un agente que **no tiene acceso al predecesor** (solo al canon: `/server`, `/client`, `doc/diag/entity_relationship/v1/script.sql`) pueda implementar la lógica de negocio ya validada, sin tener que redescubrirla ni inventarla desde cero.

---

## 1. Reglas de unicidad e integridad (portables, implementar a nivel de servicio/API, no de esquema)

El canon no declara estas restricciones como `UNIQUE` compuestas en `script.sql`, y **no se debe modificar el script para agregarlas**. Impleméntalas como validación de aplicación (en el `service`/serializer, antes de guardar), devolviendo un error 400 con mensaje claro en español — exactamente como hacía el predecesor:

- **Una agenda por dependencia, año y semestre.** No debe poder existir más de una fila en `agendas` con la misma combinación de `id_dependencia` + `anio` + `semestre`. Mensaje sugerido: *"Ya existe una agenda registrada para esta dependencia en el periodo {anio}-{semestre}."*
- **Una ficha por agenda y trámite.** No debe poder existir más de una fila en `fichas` con la misma combinación de `id_agenda` + `id_tramite_servicio`. Mensaje sugerido: *"Este trámite ya está registrado en la agenda especificada."*
- **Validación amigable de `clave` única antes de tocar la base de datos**, para `roles`, `dependencias`, `tramites_o_servicios` y `acciones` (todas ya tienen `UNIQUE` a nivel de `script.sql`, pero el error crudo de integridad de la base de datos no es legible para el usuario). Verifica existencia con una consulta antes del `INSERT`/`UPDATE` y devuelve: *"Ya existe un/a {entidad} registrado/a con la clave '{clave}'."*
- **Protección de borrado con mensaje amigable.** El canon ya definió (Sprint 1) `on_delete=PROTECT` para las FKs de catálogo (`tramites_o_servicios`, `acciones`, `actividades`, `dependencias`, `roles`, `permisos`, `usuarios` como creador). Eso evita el borrado a nivel de base de datos, pero por defecto Django/DRF devuelve un error 500/`ProtectedError` poco claro. Captura esa excepción en el método `destroy()` del `ModelViewSet` (o antes, en el `Service`) y responde 400 con un mensaje claro, por ejemplo: *"No se puede eliminar este trámite porque ya está vinculado a fichas existentes."* Aplica el mismo patrón a las demás entidades protegidas.

---

## 2. Validaciones de coherencia de datos (portables, mapeo directo de campos)

| Regla | Campo(s) en el predecesor | Campo(s) equivalente en el canon | Estado |
|---|---|---|---|
| Las solicitudes/resoluciones positivas no pueden superar las recibidas | `total_solicitudes_positivas <= total_solicitudes_recibidas` (`FichaInformacionCreate`) | `resoluciones_positivas <= solicitudes_recibidas_semestre_anterior` (tabla `fichas`) | **Portable, implementar tal cual** |
| El mes de fin de una actividad no puede ser anterior al mes de inicio | `mes_fin >= mes_inicio` (rango 1–12, `CronologiaAccionCreate`) | `num_mes_final_plazo >= num_mes_inicio_plazo` (tabla `cronograma_de_actividades_por_ficha`, rango **0–6**, no 1–12) | **Portable solo como regla de orden**, no como rango absoluto: el canon numera los meses de forma **relativa al semestre de la agenda (0 a 6)**, no como mes calendario (1 a 12) como hacía el predecesor. No asumas que ambos sistemas de numeración son intercambiables; implementa únicamente la validación de que `num_mes_final_plazo >= num_mes_inicio_plazo`, ambos dentro de 0–6 (esto último ya lo impone el `CHECK` del canon). |
| El plazo de resolución debe ser un entero no negativo | `dias_plazo_resolucion >= 0` | `plazo_maximo_resolucion_dias >= 0` | Ya cubierto por el `CHECK` del canon; no requiere lógica adicional más allá de un mensaje de validación amigable en el formulario del cliente. |

---

## 3. Máquina de estados (portable, con adaptación porque el canon la generaliza a dos entidades)

El predecesor solo tenía máquina de estados en `agendas_semestrales.estado` (`String`, valores explícitos: `borrador`, `enviada`, `aprobada`, `observada`, `rechazada`), con un endpoint dedicado (`PATCH /estado`) que valida el nuevo valor contra esa lista antes de aplicarlo.

El canon ya tiene un campo `status` (tipo `INT`, `CHECK (status >= 0)`) tanto en `agendas` como en `fichas`, pero **sin enumeración cerrada de valores** (el comentario del script solo ejemplifica `0: borrador, 1: revisión pendiente, etc.`, sin cerrar la lista). Esto es exactamente el tipo de definición de negocio que faltaba y que aquí se recupera:

- Define explícitamente, como `choices`/constantes en el modelo Django (sin alterar la columna ni el `CHECK` ya existente, que sigue siendo válido porque solo exige `>= 0`), la siguiente enumeración para `agendas.status`, tomada del predecesor:
  `0 = Borrador`, `1 = Enviada`, `2 = Aprobada`, `3 = Observada`, `4 = Rechazada`.
- Implementa una transición de estado controlada (equivalente al `PATCH /estado` del predecesor) que valide que el nuevo valor esté dentro de esos 5 estados antes de aplicarlo, en vez de aceptar cualquier entero `>= 0` vía el `PATCH`/`PUT` genérico del CRUD.
- Para `fichas.status`, el predecesor no tenía un estado explícito equivalente (las fichas no tenían flujo de aprobación propio, solo pertenecían a una agenda con su propio estado). **No inventes una máquina de estados para `fichas.status`** que el predecesor no tenía: puedes dejar el mismo criterio simple de "borrador/completa" (`0`/`1`) si el equipo lo desea, pero documenta esto como una decisión nueva, no como algo rescatado, y no la bloquees con un endpoint dedicado si no hay certeza del flujo.

---

## 4. Regla de propiedad/alcance por dependencia (portable, recomendable para RBAC)

El predecesor, en su capa de autenticación (`middleware.py`) y en los controladores de `agendas`, **nunca confiaba en el `id_dependencia` que llegaba en el cuerpo de la petición**: lo forzaba siempre desde la identidad de la sesión autenticada (token/JWT), tanto al crear como al actualizar una agenda. Esto evita que un usuario de una dependencia registre o reasigne agendas de otra dependencia con solo cambiar un número en el payload.

Recomendación para el canon (nueva capa a implementar, no existía explícitamente en el Sprint 1 del servidor actual):

- Al crear o actualizar una `Agenda`, si el usuario autenticado **no** tiene un rol con privilegio "administrador/root" (usa el mecanismo de `permisos`/`roles_has_permisos` ya definido en el canon), fuerza `id_dependencia = request.user.id_dependencia`, ignorando cualquier valor de `id_dependencia` recibido en el body.
- Aplica el mismo criterio, si tiene sentido para el negocio, sobre otras entidades que dependen de una dependencia (por ejemplo, restringir qué `usuarios` puede administrar un enlace de dependencia). Si hay ambigüedad sobre a qué otras entidades aplica, no la fuerces sin confirmarlo — esto es una extensión razonable, no algo literalmente rescatado del predecesor para otras tablas.

---

## 5. Catálogo oficial semilla: 11 Acciones de Simplificación y Digitalización (LNETB)

El predecesor traía precargado, como dato semilla (`db/seed_data.sql`), el catálogo **oficial y cerrado** de las 11 acciones de simplificación/digitalización de la LNETB (Sección VI del formulario oficial). El canon ya tiene la tabla `acciones` con la estructura correcta (`clave`, `titulo`, `descripcion`, `simplificacion_o_digitalizacion`) pero **vacía**. Esta es información de negocio real, no inventada, y debe sembrarse tal cual (respetando que en el canon `simplificacion_o_digitalizacion = TRUE` significa simplificación y `FALSE` significa digitalización, según el comentario del propio `script.sql`):

| `clave` | `titulo` | `simplificacion_o_digitalizacion` |
|---|---|---|
| `AMP_VIGENCIA` | Ampliar la vigencia del trámite o servicio | TRUE (simplificación) |
| `RED_PLAZO` | Reducir el plazo de resolución | TRUE (simplificación) |
| `RED_REQUISITOS` | Reducir los requisitos del trámite o servicio | TRUE (simplificación) |
| `ELI_REQUISITOS` | Eliminar requisitos del trámite o servicio | TRUE (simplificación) |
| `FUS_TRAMITES` | Fusionar trámites y/o modalidades | TRUE (simplificación) |
| `SUP_COSTOS_BUR` | Supresión de obligaciones regulatorias que representen costos burocráticos para las personas | TRUE (simplificación) |
| `CONV_AVISOS` | Conversión de trámites en avisos o manifestaciones | TRUE (simplificación) |
| `SIMP_FORMATOS` | Implementar o simplificar formatos | TRUE (simplificación) |
| `OTRAS_SIMP` | Otras acciones que contribuyan a la simplificación administrativa, la eficiencia regulatoria o a mejorar la experiencia | TRUE (simplificación) |
| `INC_VENTANILLA` | Incorporar el trámite o servicio a la Ventanilla Única Digital | FALSE (digitalización) |
| `OTRAS_DIGI` | Implementar otras soluciones tecnológicas que permitan eficientar el trámite o servicio | FALSE (digitalización) |

**Nota sobre un campo que el predecesor sí tenía y el canon no**: `acciones_catalogo.requiere_descripcion` (booleano que marcaba `OTRAS_SIMP`/`OTRAS_DIGI` como acciones que exigen una descripción libre al capturarse en una ficha). El canon no tiene ese campo en `acciones`, ni tampoco un campo de descripción libre en `fichas_has_acciones` donde guardarla. **No se puede portar esta regla sin modificar el esquema — no lo hagas.** Queda documentado como limitación (ver sección 7).

---

## 6. Algoritmo de priorización de trámites (FASD 01) — portable de forma **parcial**

El predecesor calculaba, en tiempo de exportación (no almacenado), un puntaje de priorización por trámite con esta fórmula (siempre a partir de la ficha, nunca de datos externos):

- **Tipo de gestión** (según el tipo de trámite): Presencial = 5 pts, Ambos = 2 pts, Digital = 1 pt.
- **Tipo de solicitud**: variaba de 1 a 10 pts según la categoría (mayor puntaje cuando "no requiere solicitud formal").
- **Plazo de resolución**: `> 15 días` = 15 pts, `6–15 días` = 10 pts, `1–5 días` = 5 pts, inmediato = 1 pt.
- **Número de requisitos vinculados**: `> 6` = 15 pts, `4–6` = 10 pts, `1–3` = 5 pts, `0` = 1 pt.
- **Población vulnerable**: 20 pts si `dirigido_a_vulnerables` es verdadero, 0 si no.
- **Volumen de solicitudes**: `> 500` = 15 pts, `100–500` = 10 pts, `< 100` = 5 pts.
- **Fundamento jurídico**: hasta 40 pts repartidos en 5 sub-factores (existencia de fundamento del trámite, de requisitos, de plazo, de vigencia, de tipo de resolutivo/cobro).
- Puntaje total = suma de todos los factores anteriores.

**Lo que sí es portable tal cual al canon** (mapeo directo de campos, mismos umbrales numéricos):

- Plazo de resolución → usa `plazo_maximo_resolucion_dias` (misma escala de umbrales: >15/6-15/1-5/inmediato).
- Población vulnerable → usa `poblacion_prioritaria_atencion_preferente` (20 pts si es verdadero, 0 si no).
- Volumen de solicitudes → usa `solicitudes_recibidas_semestre_anterior` (mismos umbrales >500/100-500/<100).

**Lo que NO es portable tal cual, y por qué (no inventes campos nuevos para resolverlo):**

- **Tipo de gestión**: el predecesor asumía que `tramite.tipo` solo tenía 3 valores (0=Ciudadano, 1=Empresarial, 2=Ambos). El canon define `tipo` con `CHECK (tipo >= 0 AND tipo <= 4)`, es decir, **hasta 5 categorías posibles**, cuyo significado exacto para los valores 3 y 4 no está documentado en `script.sql`. No asumas que 0/1/2 significan lo mismo que en el predecesor. Si el equipo de negocio aclara el significado completo de `tipo` (0–4), este factor puede recalibrarse; mientras tanto, omite este factor de la suma o trátalo como pendiente de definición (`# TODO(decisión pendiente)`), no lo implementes con una tabla de puntos inventada.
- **Tipo de solicitud**: el predecesor usaba `solicitud_tipo` con significado *0=no tiene, 1=escrito libre, 2=específico, 3=único*. El canon reutiliza el mismo nombre de campo y el mismo rango (0–3), pero con **significado distinto**: *0=nueva apertura, 1=renovación, 2=modificación, 3=baja*. Los puntajes del predecesor (10/5/2/1) están atados a categorías que ya no existen en el canon; **no los transplantes**. Si se desea un factor de priorización basado en `solicitud_tipo` en el canon, debe diseñarse desde cero con las categorías reales del canon — esto es una decisión de negocio nueva, no una recuperación.
- **Número de requisitos vinculados**: el canon **no tiene una tabla de requisitos ni una relación ficha-requisitos** (a diferencia del predecesor, que sí tenía `requisitos` + `ficha_requisitos`). En el canon, "requisitos sin valor" es solo un campo de texto libre (`requisitos_sin_valor` en `fichas`), no una lista contable. **Este factor no se puede calcular en el canon actual** sin agregar una tabla nueva, lo cual está fuera de alcance. Omítelo de la suma; no lo aproximes contando palabras o líneas de texto libre, sería una heurística inventada y poco confiable.
- **Fundamento jurídico (hasta 40 pts en 5 sub-factores)**: el predecesor tenía 5 campos jurídicos independientes y granulares (`articulo_fraccion_reglamento`, `articulo_fraccion_otro_reglamento`, `articulo_fraccion_ley_ingresos`, `fundamento_cobro_ley_ingresos`, `unidad_cobro`). El canon solo tiene **dos** campos jurídicos de texto libre en `fichas`: `regulacion_fundamenta_existencia_tramite` y `fundamento_en_ley_de_ingresos`. Con esa granularidad reducida, la fórmula de 5 sub-factores no puede reproducirse punto por punto. Propuesta de adaptación conservadora (documentar claramente que es una versión reducida, no la original): otorgar hasta 20 pts si `regulacion_fundamenta_existencia_tramite` no está vacío, y hasta 20 pts si `fundamento_en_ley_de_ingresos` no está vacío (manteniendo el máximo total de 40 pts del factor, pero con solo 2 de los 5 sub-factores originales). Si el equipo prefiere no aproximar, se puede omitir este factor también.

**Conclusión para este sprint**: implementa el puntaje de priorización como un método de servicio (`FichaService.calcular_puntaje_priorizacion(ficha)`) que sume únicamente los factores marcados como portables arriba (plazo, vulnerabilidad, volumen) más, si se decide incluir, la aproximación de 2 sub-factores jurídicos — dejando explícito en el docstring y en la respuesta de la API qué factores del modelo oficial completo no se están evaluando por falta de datos en el canon, para que no se interprete como un puntaje oficial completo.

---

## 7. Catálogo de documentos oficiales (Centro de Emisión y Exportación Documental)

El predecesor generaba, por cada ficha y por cada agenda, un conjunto cerrado de documentos PDF con códigos oficiales **FASD** — esta es información de negocio valiosa que no era deducible solo de los mockups de `doc/sketch` (que solo muestran el *shell* visual de la pantalla, no qué documentos produce). Se documenta aquí como catálogo de referencia para cuando se implemente esa función (candidato natural a un sprint futuro, no necesariamente este):

| Código | Nombre | Alcance | Contenido principal |
|---|---|---|---|
| FASD 01 | Priorización de Trámites o Servicios | Por ficha y por agenda completa (todas sus fichas) | Tabla de puntaje de priorización (sección 6) |
| FASD 02 | Ficha Técnica del Análisis a Simplificar | Por ficha | Datos generales, trámite, fundamento jurídico |
| FASD 03 | Acciones de Simplificación y Digitalización | Por ficha | Acciones vinculadas a la ficha (tabla `fichas_has_acciones`) |
| FASD 04 | Cronología de Integración — Simplificación | Por ficha | Actividades del cronograma cuyas acciones son de tipo simplificación |
| FASD 05 | Cronología de Integración — Digitalización | Por ficha | Actividades del cronograma cuyas acciones son de tipo digitalización |
| FASD 06 | Diagnóstico del Trámite o Servicio | Por ficha | Campos de diagnóstico operativo y matriz de digitalización |
| — | Agenda de Simplificación (agregado) | Por agenda | Consolidado de FASD 03/04 de tipo simplificación, de todas las fichas de la agenda |
| — | Agenda de Digitalización (agregado) | Por agenda | Consolidado de FASD 03/05 de tipo digitalización, de todas las fichas de la agenda |
| — | Agenda Completa / Maestro | Por agenda | Consolidado de todos los documentos anteriores de la agenda |

El predecesor también ofrecía descarga de **todos los documentos de una ficha o de una agenda como un solo archivo `.zip`**. Esto confirma y completa el propósito de la pantalla "Centro de Emisión y Exportación Documental" ya bosquejada en `doc/sketch`, hoy marcada como "Próximamente" en el cliente actual.

**No se pide implementar esto en este sprint** (ver alcance del prompt de sprint 3); se documenta para no perder este conocimiento de negocio de cara a un sprint futuro dedicado a exportación/documentos.

---

## 8. Qué NO portar del predecesor (antipatrones que el canon ya corrige)

- **Columnas de trazabilidad duplicadas** (`creado_por_curp`, `creado_por_nombre`, `actualizado_por_curp` guardadas como texto plano en cada tabla). El canon ya resuelve esto correctamente con `created_by` como `ForeignKey` a `usuarios`: no hay que duplicar esos datos como texto, se obtienen por relación. No repliques este patrón.
- **Cronología de actividades como filas ad-hoc por ficha** (`cronologias_accion` del predecesor, con `no_actividad`, `descripcion_actividad` y `entregables` repetidos en cada fila y sin catálogo reutilizable). El canon ya normalizó esto correctamente separando `acciones` → `actividades` → `entregables` como catálogos reutilizables, con `cronograma_de_actividades_por_ficha` solo para la calendarización. Esta es precisamente una de las "fallas estructurales" del predecesor que el canon ya no tiene: no la reintroduzcas.
- **Catálogo de requisitos y su relación M:N con fichas** (`requisitos`, `ficha_requisitos`, `diagnostico_requisitos_sin_valor`). El canon deliberadamente no tiene estas tablas (usa un campo de texto libre). No agregues estas tablas ni las simules con estructuras paralelas fuera del modelo de datos.
- **Stack tecnológico** (FastAPI + SQLAlchemy + SQLite plano, JWT propio con secreto compartido hardcodeado por defecto). El canon ya está construido en Django + DRF + `simplejwt`, con su propio modelo de autenticación (Sprint 1). No mezcles patrones de FastAPI/SQLAlchemy en el canon.
