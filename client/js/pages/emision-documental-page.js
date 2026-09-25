import { agendasService, fichasService } from '../services/crud-factory.js';
import { renderInstitutionalBanner, showToast } from '../components/organisms.js';
import { renderBadge, renderSpinner } from '../components/atoms.js';
import { generarDocumentoFicha, generarDocumentoAgenda } from '../services/documento-fasd-generator.js';

export async function renderEmisionDocumentalPage(container) {
  let loading = true;
  let agendasList = [];
  let fichasList = [];
  let selectedAgendaId = null;
  let selectedFichaId = null;

  const documentosCatalog = [
    { codigo: 'FASD 07', nombre: 'Hoja 1: Info General + Fundamento Jurídico', alcance: 'Por Ficha', hoja: 1, descripcion: 'Datos generales del trámite, vigencias, plazos, cobros, fundamento de existencia y facultades del órgano.' },
    { codigo: 'FASD 08', nombre: 'Hoja 2: Análisis Operativo, Matriz y Hallazgos', alcance: 'Por Ficha', hoja: 2, descripcion: 'Análisis de solicitudes/positivas, ventanillas de atención, cuellos de botella y matriz de madurez digital (LNETB).' },
    { codigo: 'FASD 09', nombre: 'Hoja 3: Checklist de Acciones del Catálogo', alcance: 'Por Ficha', hoja: 3, descripcion: 'Checklist completo del catálogo oficial de acciones de simplificación y digitalización con casillas marcadas.' },
    { codigo: 'FASD 03', nombre: 'Hoja 4: Tabla de Acciones Vinculadas', alcance: 'Por Ficha', hoja: 4, descripcion: 'Tabla de acciones LNETB vinculadas específicamente a esta ficha diagnóstica, con entregables esperados.' },
    { codigo: 'FASD 04', nombre: 'Hoja 5: Gantt de Simplificación', alcance: 'Por Ficha', hoja: 5, descripcion: 'Cronograma semestral de actividades operativas de simplificación con celdas de mes calendarizadas.' },
    { codigo: 'FASD 05', nombre: 'Hoja 6: Gantt de Digitalización', alcance: 'Por Ficha', hoja: 6, descripcion: 'Cronograma semestral de actividades operativas de digitalización con celdas de mes calendarizadas.' },
    { codigo: 'FASD COMP', nombre: 'Compilación Oficial Completa (Agenda)', alcance: 'Por Agenda', hoja: '1-6', descripcion: 'Expediente consolidado con las 6 hojas de todas las fichas diagnósticas de la agenda en secuencia continua.' },
  ];

  async function loadData() {
    loading = true;
    render();

    try {
      const [resAgendas, resFichas] = await Promise.all([
        agendasService.list({ page_size: 100 }),
        fichasService.list({ page_size: 100 }),
      ]);

      agendasList = resAgendas.results || [];
      fichasList = resFichas.results || [];

      if (agendasList.length > 0 && !selectedAgendaId) {
        selectedAgendaId = agendasList[0].id_agenda;
      }
      if (fichasList.length > 0 && !selectedFichaId) {
        const fichasAgenda = fichasList.filter(f => (f.id_agenda?.id_agenda || f.id_agenda) === selectedAgendaId);
        selectedFichaId = (fichasAgenda.length > 0 ? fichasAgenda[0] : fichasList[0]).id_ficha;
      }
    } catch (err) {
      console.error('Error al cargar datos en Centro de Emisión Documental:', err);
      showToast('Error al cargar catálogos de agendas y fichas', 'error');
    } finally {
      loading = false;
      render();
    }
  }

  function getFichasFiltradas() {
    if (!selectedAgendaId) return fichasList;
    return fichasList.filter(f => {
      const agId = f.id_agenda?.id_agenda || f.id_agenda_id || f.id_agenda;
      return Number(agId) === Number(selectedAgendaId);
    });
  }

  function render() {
    if (loading) {
      container.innerHTML = `
        ${renderInstitutionalBanner(
          'Centro de Emisión y Exportación Documental',
          'Generación del Documento Oficial Imprimible FASD 01–06 (LNETB)',
          'MÓDULO DE EMISIÓN'
        )}
        <div class="py-16 text-center">${renderSpinner('lg')}</div>
      `;
      return;
    }

    const fichasFiltradas = getFichasFiltradas();

    container.innerHTML = `
      ${renderInstitutionalBanner(
        'Centro de Emisión y Exportación Documental',
        'Generación e Impresión del Documento Oficial FASD (Formato Hoja Carta Oficial)',
        'MÓDULO DE EMISIÓN'
      )}

      <!-- Panel de Control Principal de Generación -->
      <div class="mb-space-lg p-space-lg rounded-2xl bg-surface-card border border-border-gold shadow-2xl relative overflow-hidden flex flex-col gap-6">
        <div class="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shadow-md">
              <span class="material-symbols-outlined text-[28px]">print</span>
            </div>
            <div>
              <span class="px-2.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-700/50 font-data-mono text-label-sm uppercase font-bold">
                MÓDULO FUNCIONAL ACTIVO
              </span>
              <h2 class="font-headline-md text-headline-sm text-text-primary font-bold mt-1">
                Generador del Documento Oficial FASD (Formato Imprimible)
              </h2>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full bg-primary/10 text-primary border border-border-gold text-xs font-semibold">
              Formato Hoja Carta (6 Hojas / Ficha)
            </span>
          </div>
        </div>

        <!-- Selección de Contexto: Agenda y Ficha -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Seleccionar Agenda -->
          <div class="p-4 rounded-xl bg-surface-container border border-border-subtle space-y-2">
            <label for="select-agenda-emision" class="font-title-md text-sm font-bold text-text-primary flex items-center gap-1.5">
              <span class="material-symbols-outlined text-primary text-[18px]">calendar_today</span>
              1. Seleccionar Agenda Regulatoria:
            </label>
            <select id="select-agenda-emision" class="w-full px-3 py-2 rounded-lg bg-surface-card border border-border-subtle text-text-primary font-body-sm text-sm focus:outline-none focus:border-primary">
              ${agendasList.length === 0 ? '<option value="">No hay agendas disponibles</option>' : ''}
              ${agendasList.map(a => `
                <option value="${a.id_agenda}" ${Number(a.id_agenda) === Number(selectedAgendaId) ? 'selected' : ''}>
                  Agenda #AG-${a.id_agenda} | ${a.id_dependencia?.clave || 'Dep'} — Año ${a.anio} (${a.semestre ? '1er Sem' : '2do Sem'})
                </option>
              `).join('')}
            </select>
            <p class="text-[11px] text-text-tertiary">
              Permite generar la compilación oficial completa de todas las fichas pertenecientes a la agenda.
            </p>
          </div>

          <!-- Seleccionar Ficha -->
          <div class="p-4 rounded-xl bg-surface-container border border-border-subtle space-y-2">
            <label for="select-ficha-emision" class="font-title-md text-sm font-bold text-text-primary flex items-center gap-1.5">
              <span class="material-symbols-outlined text-primary text-[18px]">description</span>
              2. Seleccionar Ficha Diagnóstica:
            </label>
            <select id="select-ficha-emision" class="w-full px-3 py-2 rounded-lg bg-surface-card border border-border-subtle text-text-primary font-body-sm text-sm focus:outline-none focus:border-primary">
              ${fichasFiltradas.length === 0 ? '<option value="">No hay fichas para esta agenda</option>' : ''}
              ${fichasFiltradas.map(f => `
                <option value="${f.id_ficha}" ${Number(f.id_ficha) === Number(selectedFichaId) ? 'selected' : ''}>
                  Ficha #FCH-${f.id_ficha} — ${f.id_tramite_servicio?.nombre_oficial || 'Trámite'}
                </option>
              `).join('')}
            </select>
            <p class="text-[11px] text-text-tertiary">
              Muestra el documento oficial individual de 6 hojas para la ficha seleccionada.
            </p>
          </div>
        </div>

        <!-- Botones de Acción de Generación -->
        <div class="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-border-subtle">
          <button
            type="button"
            id="btn-generar-ficha-individual"
            class="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-title-md text-sm font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer ${!selectedFichaId ? 'opacity-50 pointer-events-none' : ''}"
          >
            <span class="material-symbols-outlined text-[20px]">description</span>
            <span>Generar Ficha Seleccionada (6 Hojas)</span>
          </button>

          <button
            type="button"
            id="btn-generar-agenda-completa"
            class="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-title-md text-sm font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer ${!selectedAgendaId ? 'opacity-50 pointer-events-none' : ''}"
          >
            <span class="material-symbols-outlined text-[20px]">print</span>
            <span>Generar Agenda Completa FASD (${fichasFiltradas.length} Fichas)</span>
          </button>
        </div>
      </div>

      <!-- Catálogo de Documentos Oficiales Habilitados -->
      <div class="flex flex-col gap-space-md mb-space-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-space-xs">
            <span class="material-symbols-outlined text-primary text-[24px]">menu_book</span>
            <h3 class="font-headline-sm text-headline-sm font-bold text-text-primary">Estructura del Expediente FASD Imprimible</h3>
          </div>
          <span class="text-xs text-text-tertiary font-data-mono">Plantilla oficial fix1.html</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          ${documentosCatalog.map(doc => `
            <div class="p-space-md rounded-xl bg-surface-card border border-border-subtle shadow-md flex flex-col justify-between gap-3 hover:border-border-gold transition-colors relative overflow-hidden">
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <span class="px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-border-gold font-data-mono font-bold text-xs">
                    ${doc.codigo}
                  </span>
                  <span class="px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-700/50 font-data-mono text-[10px] font-bold">
                    Hoja ${doc.hoja}
                  </span>
                </div>
                <h4 class="font-title-md text-title-md font-bold text-text-primary mt-1">${doc.nombre}</h4>
                <p class="font-body-sm text-body-sm text-text-secondary leading-relaxed">${doc.descripcion}</p>
              </div>

              <div class="pt-3 border-t border-border-subtle/50 flex items-center justify-between">
                <span class="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">check_circle</span>
                  Funcional con API
                </span>
                <button
                  type="button"
                  data-action="generar-doc-card"
                  data-hoja="${doc.hoja}"
                  class="px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary border border-border-subtle text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span class="material-symbols-outlined text-[14px]">visibility</span>
                  <span>Ver en documento</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    const selectAgenda = container.querySelector('#select-agenda-emision');
    if (selectAgenda) {
      selectAgenda.addEventListener('change', (e) => {
        selectedAgendaId = parseInt(e.target.value, 10) || null;
        const fichasAgenda = getFichasFiltradas();
        selectedFichaId = fichasAgenda.length > 0 ? fichasAgenda[0].id_ficha : null;
        render();
      });
    }

    const selectFicha = container.querySelector('#select-ficha-emision');
    if (selectFicha) {
      selectFicha.addEventListener('change', (e) => {
        selectedFichaId = parseInt(e.target.value, 10) || null;
        render();
      });
    }

    const btnFichaInd = container.querySelector('#btn-generar-ficha-individual');
    if (btnFichaInd) {
      btnFichaInd.addEventListener('click', async () => {
        if (!selectedFichaId) {
          showToast('Seleccione una ficha diagnóstica', 'warning');
          return;
        }
        try {
          showToast('Generando documento oficial FASD (6 Hojas)...', 'info');
          await generarDocumentoFicha(selectedFichaId);
        } catch (err) {
          console.error('Error al generar documento de ficha:', err);
          showToast(err.message || 'Error al generar el documento', 'error');
        }
      });
    }

    const btnAgendaComp = container.querySelector('#btn-generar-agenda-completa');
    if (btnAgendaComp) {
      btnAgendaComp.addEventListener('click', async () => {
        if (!selectedAgendaId) {
          showToast('Seleccione una agenda regulatoria', 'warning');
          return;
        }
        try {
          showToast('Generando compilación oficial FASD para la agenda...', 'info');
          await generarDocumentoAgenda(selectedAgendaId);
        } catch (err) {
          console.error('Error al generar compilación de agenda:', err);
          showToast(err.message || 'Error al generar la compilación', 'error');
        }
      });
    }

    container.addEventListener('click', async (e) => {
      const btnDocCard = e.target.closest('[data-action="generar-doc-card"]');
      if (btnDocCard) {
        if (!selectedFichaId) {
          showToast('Seleccione primero una ficha diagnóstica', 'warning');
          return;
        }
        try {
          showToast('Generando documento oficial FASD...', 'info');
          await generarDocumentoFicha(selectedFichaId);
        } catch (err) {
          console.error('Error al generar documento:', err);
          showToast(err.message || 'Error al generar documento', 'error');
        }
      }
    });
  }

  await loadData();
}
