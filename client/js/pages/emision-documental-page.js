import { renderInstitutionalBanner } from '../components/organisms.js';
import { renderBadge, renderButton } from '../components/atoms.js';

export async function renderEmisionDocumentalPage(container) {
  const documentosCatalog = [
    { codigo: 'FASD 01', nombre: 'Priorización de Trámites o Servicios', alcance: 'Por Ficha / Agenda', descripcion: 'Tabla de evaluación del algoritmo de priorización (plazo, vulnerabilidad, volumen y fundamento legal).' },
    { codigo: 'FASD 02', nombre: 'Ficha Técnica del Análisis a Simplificar', alcance: 'Por Ficha', descripcion: 'Resumen ejecutivo con datos generales del trámite, fundamentación jurídica y vigencias.' },
    { codigo: 'FASD 03', nombre: 'Acciones de Simplificación y Digitalización', alcance: 'Por Ficha', descripcion: 'Detalle de las acciones LNETB vinculadas a la ficha diagnóstica.' },
    { codigo: 'FASD 04', nombre: 'Cronología de Integración — Simplificación', alcance: 'Por Ficha', descripcion: 'Calendario de actividades operativas pertenecientes a las acciones de simplificación.' },
    { codigo: 'FASD 05', nombre: 'Cronología de Integración — Digitalización', alcance: 'Por Ficha', descripcion: 'Calendario de actividades operativas pertenecientes a las acciones de digitalización.' },
    { codigo: 'FASD 06', nombre: 'Diagnóstico del Trámite o Servicio', alcance: 'Por Ficha', descripcion: 'Análisis de cuellos de botella, requisitos sin valor y matriz de madurez digital (Niveles 0-3).' },
    { codigo: 'AGENDA-SIMP', nombre: 'Agenda de Simplificación Regulatoria', alcance: 'Por Agenda', descripcion: 'Documento consolidado de acciones y cronogramas de simplificación de todas las fichas.' },
    { codigo: 'AGENDA-DIGI', nombre: 'Agenda de Digitalización Regulatoria', alcance: 'Por Agenda', descripcion: 'Documento consolidado de acciones y cronogramas de digitalización de todas las fichas.' },
    { codigo: 'AGENDA-ZIP', nombre: 'Expediente Maestro Comprimido (.ZIP)', alcance: 'Por Agenda / Anual', descripcion: 'Paquete descargable en archivo .ZIP con la totalidad de los dictámenes PDF oficiales.' },
  ];

  container.innerHTML = `
    ${renderInstitutionalBanner(
      'Centro de Emisión y Exportación Documental',
      'Catálogo de documentos oficiales FASD 01–06 y paquetes de exportación ejecutiva (LNETB)',
      'MÓDULO DE EMISIÓN'
    )}

    <!-- Banner de Próximamente -->
    <div class="mb-space-lg p-space-lg rounded-2xl bg-surface-card border border-border-gold shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
      <div class="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="w-20 h-20 rounded-2xl bg-primary/10 border border-border-gold flex items-center justify-center text-primary mb-4 shadow-lg">
        <span class="material-symbols-outlined text-[44px]">print</span>
      </div>

      <span class="px-3 py-1 rounded-full bg-primary/20 text-primary border border-border-gold font-data-mono text-label-sm uppercase tracking-wider mb-2">
        Módulo de Exportación Documental (Próximo Sprint)
      </span>

      <h2 class="font-headline-md text-headline-md text-text-primary font-bold max-w-xl">
        Generación de Expediente Digital Imprimible FASD 01–06
      </h2>

      <p class="font-body-sm text-body-sm text-text-secondary max-w-2xl mt-2 leading-relaxed">
        En el siguiente sprint se habilitará la generación dinámica en PDF (formato Hoja Carta Oficial) y descarga en archivo .ZIP de la documentación normada por la LNETB.
      </p>

      <div class="mt-6 flex flex-wrap items-center justify-center gap-space-sm opacity-60 pointer-events-none">
        ${renderButton({
          label: 'Exportar Compilación Oficial PDF',
          icon: 'picture_as_pdf',
          variant: 'primary',
          disabled: true,
          tooltip: 'Próximo sprint',
        })}
        ${renderButton({
          label: 'Descargar Expediente Maestro ZIP',
          icon: 'folder_zip',
          variant: 'secondary',
          disabled: true,
          tooltip: 'Próximo sprint',
        })}
      </div>
    </div>

    <!-- Catálogo de Documentos que se Generarán en el Próximo Sprint -->
    <div class="flex flex-col gap-space-md mb-space-lg">
      <div class="flex items-center gap-space-xs">
        <span class="material-symbols-outlined text-primary text-[24px]">menu_book</span>
        <h3 class="font-headline-sm text-headline-sm font-bold text-text-primary">Catálogo de Documentos Oficiales FASD Preparados</h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
        ${documentosCatalog.map(doc => `
          <div class="p-space-md rounded-xl bg-surface-card border border-border-subtle shadow-md flex flex-col justify-between gap-3 hover:border-border-gold transition-colors">
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-border-gold font-data-mono font-bold text-xs">
                  ${doc.codigo}
                </span>
                ${renderBadge(doc.alcance, 'secondary')}
              </div>
              <h4 class="font-title-md text-title-md font-bold text-text-primary mt-1">${doc.nombre}</h4>
              <p class="font-body-sm text-body-sm text-text-secondary leading-relaxed">${doc.descripcion}</p>
            </div>
            <div class="pt-2 border-t border-border-subtle/50 flex items-center justify-between text-xs font-data-mono text-text-tertiary">
              <span>Estado: Preparado</span>
              <span class="text-primary font-semibold">Sprint futuro</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
