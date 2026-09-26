/**
 * documento-fasd-generator.js
 *
 * Genera el documento oficial imprimible FASD (5 hojas) a partir de datos reales
 * de la API, replicando exactamente la versión actualizada de fix1.html.
 *
 * Hojas generadas (5 hojas en este orden, respetando el salto de ID de fix1.html):
 *   Hoja 1: id="doc-1" — FASD 07 (Información General + Fundamento Jurídico)
 *   Hoja 2: id="doc-2" — FASD 08 (Análisis Operativo + Matriz Diagnóstico + Hallazgos)
 *   Hoja 3: id="doc-3" — FASD 09 (Checklists catálogo oficial de acciones)
 *   Hoja 5: id="doc-5" — FASD 04 (Cronología de Simplificación)
 *   Hoja 6: id="doc-6" — FASD 05 (Cronología de Digitalización - 2 revisores)
 *
 * Nota: La "Hoja 4" (FASD 03) fue eliminada en fix1.html y ya no se genera.
 */

import { api } from './api.js';
import { CONFIG } from '../config.js';

// ─── Constantes ────────────────────────────────────────────────────────────────
const LOGO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCRw-2n4EGbsMA6gqudh8qScGkBW3oR1wgtQ6kBgWyKMNHi6AWOFOzcirpfBN-phkTcEyxlfUDb6HqfNXHITizG-zMi9OmjkdwXxdfSe--QxDeFu0sDp1d9_ZHu8zqVnaw3Q3v_hQpRhWMuIviR5XzqrBbiW-F2PANylR5YHmlEtsD3gujSiRDkFSA7xBn7r1k-3XWIGJviEr1Y3yMaWMLHxGLEWnHIgam0KnTw1Rz9wz7xmBTXUJAFNoEB6pzckBog1RE';

// ─── Utilidades ────────────────────────────────────────────────────────────────

function getMesesSemestre(semestre) {
  if (semestre === true || semestre === 1 || semestre === 'true') {
    return ['Ene', 'Feb', 'Mzo', 'Abr', 'May', 'Jun'];
  }
  return ['Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
}

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtFecha(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function chk(cond) {
  return cond ? 'checked' : '';
}

// ─── Encabezados y Firmas ──────────────────────────────────────────────────────

function renderEncabezadoStandard(agenda) {
  const dependencia = esc(
    (agenda.id_dependencia && agenda.id_dependencia.nombre_oficial) || ''
  );
  const semNum = agenda.semestre === true || agenda.semestre === 1 || agenda.semestre === 'true' ? '1' : '2';
  const anio = esc(agenda.anio || '');
  return `
    <div class="border border-gray-700 p-2 mb-2 grid grid-cols-12 items-center gap-2">
      <div class="col-span-4 flex items-center">
        <img alt="Ayuntamiento Logo" class="h-10 object-contain" src="${LOGO_URL}"/>
      </div>
      <div class="col-span-8 pl-3 border-l border-gray-400">
        <div class="text-[11px] text-gray-500 font-semibold mb-0.5">${dependencia}</div>
        <div class="text-[12px] font-bold text-gray-800 uppercase tracking-wide">${semNum}ª Agenda de Simplificación y Digitalización ${anio}</div>
      </div>
    </div>`;
}

function renderEncabezadoFASD(agenda, fasdCodigo) {
  const dependencia = esc(
    (agenda.id_dependencia && agenda.id_dependencia.nombre_oficial) || ''
  );
  const anio = esc(agenda.anio || '');
  return `
    <div class="border border-gray-700 p-2 mb-2 grid grid-cols-12 items-center gap-2">
      <div class="col-span-4 flex items-center">
        <img alt="Ayuntamiento Logo" class="h-10 object-contain" src="${LOGO_URL}"/>
      </div>
      <div class="col-span-8 pl-3 border-l border-gray-400 flex justify-between items-center">
        <div>
          <div class="text-[12px] text-amber-700 font-semibold mb-0.5">${dependencia}</div>
          <div class="text-[13px] font-bold text-gray-800 uppercase tracking-wide">Agenda de Simplificación y Digitalización</div>
        </div>
        <div class="text-[10px] font-mono font-bold text-gray-700 self-start">FASD ${fasdCodigo} ${anio}</div>
      </div>
    </div>`;
}

function renderFirmas(agenda, pagina, totalPaginas, esHoja6 = false) {
  const elaboro_nombre = esc(agenda.elaboro_nombre || '');
  const elaboro_puesto = esc(agenda.elaboro_puesto || '');
  const reviso1_nombre = esc(agenda.reviso1_nombre || '');
  const reviso1_puesto = esc(agenda.reviso1_puesto || '');
  const reviso2_nombre = esc(agenda.reviso2_nombre || '');
  const reviso2_puesto = esc(agenda.reviso2_puesto || '');
  const autorizo_nombre = esc(agenda.autorizo_nombre || '');
  const autorizo_puesto = esc(agenda.autorizo_puesto || '');

  if (esHoja6) {
    return `
      <table class="gov-table mb-2">
        <thead>
          <tr>
            <th class="w-1/3 py-1 font-bold">Elaboró</th>
            <th class="w-1/3 py-1 font-bold">Revisó</th>
            <th class="w-1/3 py-1 font-bold">Autorizó</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="align-bottom pb-1 text-center font-serif text-[10px] text-gray-800 h-24">${elaboro_nombre}</td>
            <td class="p-0 align-top">
              <div class="flex flex-col h-full justify-between">
                <div class="h-10 flex items-end justify-center pb-1 text-center font-serif text-[10px] text-gray-800">${reviso1_nombre}</div>
                <div class="text-center text-[8px] font-semibold bg-gray-50 border-y border-gray-700 py-0.5">${reviso1_puesto}</div>
                <div class="h-10 flex items-end justify-center pb-1 text-center font-serif text-[10px] text-gray-800">${reviso2_nombre}</div>
              </div>
            </td>
            <td class="align-bottom pb-1 text-center font-serif text-[10px] text-gray-800 h-24">${autorizo_nombre}</td>
          </tr>
          <tr class="text-center text-[9px] font-semibold bg-gray-50">
            <td class="p-1">${elaboro_puesto}</td>
            <td class="p-1">${reviso2_puesto}</td>
            <td class="p-1">${autorizo_puesto}</td>
          </tr>
        </tbody>
      </table>
      <div class="doc-footer flex items-center justify-between border-t border-gray-300 pt-1 text-[10px] text-gray-600">
        <span></span>
        <span class="font-mono">Página ${pagina} de ${totalPaginas}</span>
      </div>`;
  }

  return `
    <table class="gov-table mb-2">
      <thead>
        <tr>
          <th class="w-1/3 py-1 font-bold">Elaboró</th>
          <th class="w-1/3 py-1 font-bold">Revisó</th>
          <th class="w-1/3 py-1 font-bold">Autorizó</th>
        </tr>
      </thead>
      <tbody>
        <tr class="h-10">
          <td class="align-bottom pb-1 text-center font-serif text-[10px] text-gray-800 font-medium">${elaboro_nombre}</td>
          <td class="align-bottom pb-1 text-center font-serif text-[10px] text-gray-800 font-medium">${reviso1_nombre}</td>
          <td class="align-bottom pb-1 text-center font-serif text-[10px] text-gray-800 font-medium">${autorizo_nombre}</td>
        </tr>
        <tr class="text-center text-[9px] font-semibold bg-gray-50">
          <td class="p-1">${elaboro_puesto}</td>
          <td class="p-1">${reviso1_puesto}</td>
          <td class="p-1">${autorizo_puesto}</td>
        </tr>
      </tbody>
    </table>
    <div class="doc-footer flex items-center justify-between border-t border-gray-300 pt-1 text-[10px] text-gray-600">
      <span></span>
      <span class="font-mono">Página ${pagina} de ${totalPaginas}</span>
    </div>`;
}

// ─── HOJA 1: FASD 07 ─── Información General + Fundamento Jurídico ────────────

function renderHoja1(paquete, opts) {
  const { agenda, tramite, cobros } = paquete;
  const anio = esc(agenda.anio || '');
  const pag = opts.paginaBase + 1;
  const total = opts.totalPaginas;
  const digital = paquete.habile_portal_web_municipal || paquete.habile_app_mobile;
  const solTipo = paquete.solicitud_tipo;
  const plazoDias = paquete.plazo_maximo_resolucion_dias ?? '';
  const plazoTipo = paquete.is_dia_habil_o_inhabil ? 'días hábiles' : 'días naturales';
  const numReqs = (paquete.analisis_requisitos_json || []).length;
  const esTramite = tramite.tramite_o_servicio === true;
  const esServicio = tramite.tramite_o_servicio === false;

  // Lógica de coincidencia para tipo_tramite_dirigido (tolerante exacto / substring)
  const valDirigido = String(paquete.tipo_tramite_dirigido || '');
  const esCiudadano = valDirigido === 'Ciudadano' || valDirigido.includes('Ciudadano');
  const esEmpresarial = valDirigido === 'Empresarial' || valDirigido.includes('Empresarial');
  const esAmbos = valDirigido === 'Ambos' || valDirigido.includes('Ambos');

  let cobrosHtml = '';
  if (Array.isArray(cobros) && cobros.length > 0) {
    cobrosHtml = cobros.map(cobro => {
      const um = cobro.unidad_medida || '';
      const estaUMA = um.includes('UMA');
      const estaMXN = um.includes('Nacional') || um.includes('MXN');
      const esGratuito = cobro.importe === 0 || cobro.importe === null;
      const fp = cobro.forma_pago || '';
      const esCaja = fp.includes('Caja');
      const esBanco = fp.includes('Banco');
      const esBancaElec = fp.includes('electrónica') || fp.includes('Linea');
      return `
        <div class="grid grid-cols-12 border-b border-gray-700 items-center bg-gray-50">
          <div class="col-span-3 p-1 font-bold border-r border-gray-700">Unidad de cobro (${esc(cobro.concepto)}):</div>
          <div class="col-span-9 p-1 flex flex-wrap gap-6 text-[9.5px]">
            <label class="flex items-center gap-1 font-semibold"><input type="checkbox" class="rounded" ${chk(estaUMA)}/> UMA'S</label>
            <label class="flex items-center gap-1"><input type="checkbox" class="rounded" ${chk(estaMXN)}/> Moneda Nacional</label>
            <label class="flex items-center gap-1"><input type="checkbox" class="rounded" ${chk(esGratuito)}/> Gratuito</label>
          </div>
        </div>
        <div class="grid grid-cols-12 border-b border-gray-700 items-center">
          <div class="col-span-4 p-1.5 font-bold bg-gray-100 border-r border-gray-700">Importe del trámite:</div>
          <div class="col-span-8 p-1.5 font-bold border-r border-gray-700">${esc(cobro.importe ?? '')}</div>
        </div>
        <div class="grid grid-cols-12 items-center">
          <div class="col-span-2 p-1.5 font-bold bg-gray-100 border-r border-gray-700">Formas de pago:</div>
          <div class="col-span-4 p-1.5 flex flex-wrap gap-2 text-[9.5px] border-r border-gray-700">
            <label class="flex items-center gap-1"><input type="checkbox" class="rounded" ${chk(esCaja)}/> Cajas propias</label>
            <label class="flex items-center gap-1"><input type="checkbox" class="rounded" ${chk(esBanco)}/> Bancos</label>
            <label class="flex items-center gap-1"><input type="checkbox" class="rounded" ${chk(esBancaElec)}/> Banca electrónica</label>
          </div>
          <div class="col-span-3 p-1.5 font-bold bg-gray-100 border-r border-gray-700 text-center">Tipo de trámite o servicio:</div>
          <div class="col-span-3 p-1.5 flex flex-wrap gap-2 text-[9.5px] justify-around">
            <label class="flex items-center gap-1"><input type="checkbox" class="rounded" ${chk(esCiudadano)}/> Ciudadano</label>
            <label class="flex items-center gap-1"><input type="checkbox" class="rounded" ${chk(esEmpresarial)}/> Empresarial</label>
            <label class="flex items-center gap-1"><input type="checkbox" class="rounded" ${chk(esAmbos)}/> Ambos</label>
          </div>
        </div>`;
    }).join('');
  } else {
    const uCobro = paquete.unidad_de_cobro || '';
    const importeVal = paquete.importe_tramite;
    const formasPago = paquete.formas_de_pago || [];
    const fpStr = Array.isArray(formasPago) ? formasPago.join(' ') : String(formasPago);
    cobrosHtml = `
      <div class="grid grid-cols-12 border-b border-gray-700 items-center bg-gray-50">
        <div class="col-span-3 p-1 font-bold border-r border-gray-700">Unidad de cobro:</div>
        <div class="col-span-9 p-1 flex flex-wrap gap-6 text-[9.5px]">
          <label class="flex items-center gap-1 font-semibold"><input type="checkbox" class="rounded" ${chk(uCobro.includes('UMA'))}/> UMA'S</label>
          <label class="flex items-center gap-1"><input type="checkbox" class="rounded" ${chk(uCobro.includes('Nacional') || uCobro.includes('MXN'))}/> Moneda Nacional</label>
          <label class="flex items-center gap-1"><input type="checkbox" class="rounded" ${chk(importeVal === 0 || !importeVal || uCobro.toLowerCase().includes('gratuit'))}/> Gratuito</label>
        </div>
      </div>
      <div class="grid grid-cols-12 border-b border-gray-700 items-center">
        <div class="col-span-4 p-1.5 font-bold bg-gray-100 border-r border-gray-700">Importe del trámite:</div>
        <div class="col-span-8 p-1.5 font-bold border-r border-gray-700">${esc(importeVal ?? '0.00')}</div>
      </div>
      <div class="grid grid-cols-12 items-center">
        <div class="col-span-2 p-1.5 font-bold bg-gray-100 border-r border-gray-700">Formas de pago:</div>
        <div class="col-span-4 p-1.5 flex flex-wrap gap-2 text-[9.5px] border-r border-gray-700">
          <label class="flex items-center gap-1"><input type="checkbox" class="rounded" ${chk(fpStr.includes('Caja'))}/> Cajas propias</label>
          <label class="flex items-center gap-1"><input type="checkbox" class="rounded" ${chk(fpStr.includes('Banco'))}/> Bancos</label>
          <label class="flex items-center gap-1"><input type="checkbox" class="rounded" ${chk(fpStr.includes('electrónica') || fpStr.includes('Linea'))}/> Banca electrónica</label>
        </div>
        <div class="col-span-3 p-1.5 font-bold bg-gray-100 border-r border-gray-700 text-center">Tipo de trámite o servicio:</div>
        <div class="col-span-3 p-1.5 flex flex-wrap gap-2 text-[9.5px] justify-around">
          <label class="flex items-center gap-1"><input type="checkbox" class="rounded" ${chk(esCiudadano)}/> Ciudadano</label>
          <label class="flex items-center gap-1"><input type="checkbox" class="rounded" ${chk(esEmpresarial)}/> Empresarial</label>
          <label class="flex items-center gap-1"><input type="checkbox" class="rounded" ${chk(esAmbos)}/> Ambos</label>
        </div>
      </div>`;
  }

  return `
    <article class="page-sheet doc-item" data-doc-title="Hoja 1" id="doc-1-f${paquete.id_ficha}">
      <div>
        ${renderEncabezadoStandard(agenda)}
        <div class="flex justify-between items-baseline mb-2">
          <h2 class="text-xs font-bold text-gray-900 uppercase">I. INFORMACIÓN GENERAL</h2>
          <div class="text-[10px] font-medium">Fecha del levantamiento: <span class="font-bold">${fmtFecha(paquete.created_at)}</span></div>
          <span class="text-[11px] font-mono font-bold text-gray-700">FASD 07 ${anio}</span>
        </div>
        <div class="border border-gray-700 text-[10px] mb-2">
          <div class="grid grid-cols-12 border-b border-gray-700">
            <div class="col-span-4 p-1.5 font-bold bg-gray-100 border-r border-gray-700">Nombre de la Unidad Administrativa:</div>
            <div class="col-span-8 p-1.5 font-medium">${esc(agenda.unidad_administrativa || '')}</div>
          </div>
          <div class="grid grid-cols-12 border-b border-gray-700 items-center">
            <div class="col-span-4 p-1.5 font-bold bg-gray-100 border-r border-gray-700">Nombre oficial del trámite o servicio:</div>
            <div class="col-span-5 p-1.5 font-medium">${esc(tramite.nombre_oficial || '')}</div>
            <div class="col-span-3 p-1.5 border-l border-gray-700 bg-gray-50"><span class="font-bold">Clave:</span> ${esc(tramite.clave || '')}</div>
          </div>
          <div class="grid grid-cols-12 border-b border-gray-700 items-center bg-gray-50">
            <div class="col-span-3 p-1 font-bold border-r border-gray-700">Tipo de Gestión:</div>
            <div class="col-span-9 p-1 flex gap-6">
              <label class="flex items-center gap-1 font-semibold"><input class="rounded" type="checkbox" ${chk(esTramite)}/> Trámite</label>
              <label class="flex items-center gap-1 font-semibold"><input class="rounded" type="checkbox" ${chk(esServicio)}/> Servicio</label>
            </div>
          </div>
          <div class="grid grid-cols-12 border-b border-gray-700">
            <div class="col-span-4 p-1.5 font-bold bg-gray-100 border-r border-gray-700">Objetivo del trámite:</div>
            <div class="col-span-8 p-1.5 text-gray-800">${esc(tramite.objetivo || '')}</div>
          </div>
          <div class="grid grid-cols-12 border-b border-gray-700 items-center">
            <div class="col-span-3 p-1.5 font-bold bg-gray-100 border-r border-gray-700">Medios de atención:</div>
            <div class="col-span-9 p-1.5 flex flex-wrap gap-4 text-[9.5px]">
              <label class="flex items-center gap-1"><input class="rounded" type="checkbox" ${chk(paquete.habile_linea_telefonica)}/> Telefónico</label>
              <label class="flex items-center gap-1"><input class="rounded" type="checkbox" ${chk(paquete.habile_ventanilla_presencial)}/> Presencial</label>
              <label class="flex items-center gap-1"><input class="rounded" type="checkbox" ${chk(digital)}/> Digital</label>
            </div>
          </div>
          <div class="grid grid-cols-12 border-b border-gray-700 items-center">
            <div class="col-span-3 p-1.5 font-bold bg-gray-100 border-r border-gray-700">Tipo de solicitud:</div>
            <div class="col-span-9 p-1.5 flex flex-wrap gap-4 text-[9.5px]">
              <label class="flex items-center gap-1"><input class="rounded" type="checkbox" ${chk(solTipo === 0)}/> No tiene</label>
              <label class="flex items-center gap-1"><input class="rounded" type="checkbox" ${chk(solTipo === 1)}/> Escrito libre</label>
              <label class="flex items-center gap-1"><input class="rounded" type="checkbox" ${chk(solTipo === 2)}/> Formato específico</label>
              <label class="flex items-center gap-1 font-semibold"><input class="rounded" type="checkbox" ${chk(solTipo === 3)}/> Formato único</label>
            </div>
          </div>
          <div class="grid grid-cols-12 border-b border-gray-700 items-center">
            <div class="col-span-4 p-1.5 font-bold bg-gray-100 border-r border-gray-700">Plazo para resolver la solicitud:</div>
            <div class="col-span-3 p-1.5 font-medium border-r border-gray-700 text-blue-900 font-bold">${esc(plazoDias)} ${plazoTipo}</div>
            <div class="col-span-3 p-1.5 font-bold bg-gray-100 border-r border-gray-700 text-center">Vigencia del resolutivo:</div>
            <div class="col-span-2 p-1.5 font-medium text-center">${esc(paquete.vigencia_del_documento_obtenido || '')}</div>
          </div>
          <div class="grid grid-cols-12 border-b border-gray-700 items-center">
            <div class="col-span-6 p-1.5 font-bold bg-gray-100 border-r border-gray-700">Número de requisitos que tiene el trámite o servicio:</div>
            <div class="col-span-6 p-1.5 font-bold text-center">${numReqs}</div>
          </div>
          <div class="grid grid-cols-12 border-b border-gray-700 items-center">
            <div class="col-span-6 p-1.5 font-bold bg-gray-100 border-r border-gray-700">Total de solicitudes recibidas en el ejercicio inmediato anterior:</div>
            <div class="col-span-6 p-1.5 font-bold text-center">${esc(paquete.solicitudes_recibidas_semestre_anterior ?? '')}</div>
          </div>
          <div class="grid grid-cols-12 border-b border-gray-700 items-center">
            <div class="col-span-6 p-1.5 font-bold bg-gray-100 border-r border-gray-700">De las solicitudes anteriores ¿Cuántas fueron resoluciones positivas?:</div>
            <div class="col-span-6 p-1.5 font-bold text-center">${esc(paquete.resoluciones_positivas ?? '')}</div>
          </div>
          <div class="grid grid-cols-12 border-b border-gray-700 items-center">
            <div class="col-span-4 p-1.5 font-bold bg-gray-100 border-r border-gray-700">Cantidad de personas que intervienen:</div>
            <div class="col-span-2 p-1.5 font-bold text-center border-r border-gray-700">${esc(paquete.cantidad_personas_intervienen ?? '')}</div>
            <div class="col-span-4 p-1.5 font-bold bg-gray-100 border-r border-gray-700 text-center">Cantidad de áreas que intervienen:</div>
            <div class="col-span-2 p-1.5 font-bold text-center">${esc(paquete.areas_administrativas_interfieren ?? '')}</div>
          </div>
          <div class="grid grid-cols-12 border-b border-gray-700 items-center">
            <div class="col-span-8 p-1.5 font-bold bg-gray-100 border-r border-gray-700">¿Este trámite o servicio está dirigido a personas o grupos de atención prioritaria o vulnerable?:</div>
            <div class="col-span-4 p-1.5 flex justify-around font-semibold">
              <label class="flex items-center gap-1"><input class="rounded" type="checkbox" ${chk(paquete.poblacion_prioritaria_atencion_preferente)}/> Sí</label>
              <label class="flex items-center gap-1"><input class="rounded" type="checkbox" ${chk(!paquete.poblacion_prioritaria_atencion_preferente)}/> No</label>
            </div>
          </div>
          <div class="grid grid-cols-12 items-center">
            <div class="col-span-8 p-1.5 font-bold bg-gray-100 border-r border-gray-700">Valor de la priorización de este trámite o servicio:</div>
            <div class="col-span-4 p-1.5 font-bold text-center">${esc(paquete.valor_priorizacion ?? 0)}</div>
          </div>
        </div>
        <div class="flex justify-between items-baseline mb-1">
          <h2 class="text-xs font-bold text-gray-900 uppercase">II. FUNDAMENTO JURÍDICO</h2>
        </div>
        <div class="border border-gray-700 text-[10px] mb-2">
          <div class="grid grid-cols-12 border-b border-gray-700 items-center">
            <div class="col-span-4 p-1.5 font-bold bg-gray-100 border-r border-gray-700">Nombre, artículo y fracción de la regulación en la que se fundamenta el trámite o servicio:</div>
            <div class="col-span-8 p-1.5">${esc(paquete.regulacion_fundamenta_existencia_tramite || '')}</div>
          </div>
          <div class="grid grid-cols-12 border-b border-gray-700 items-center">
            <div class="col-span-4 p-1.5 font-bold bg-gray-100 border-r border-gray-700">Nombre de la regulación que faculta al Órgano Administrativo:</div>
            <div class="col-span-8 p-1.5">${esc(paquete.regulacion_faculta_organo || '')}</div>
          </div>
          <div class="grid grid-cols-12 border-b border-gray-700 items-center">
            <div class="col-span-4 p-1.5 font-bold bg-gray-100 border-r border-gray-700">Fundamento legal en la Ley de Ingresos:</div>
            <div class="col-span-8 p-1.5 font-medium">${esc(paquete.fundamento_en_ley_de_ingresos || '')}</div>
          </div>
          ${cobrosHtml}
        </div>
      </div>
      <div>${renderFirmas(agenda, pag, total, false)}</div>
    </article>`;
}

// ─── HOJA 2: FASD 08 ─── Análisis + Matriz + Hallazgos ───────────────────────

function renderHoja2(paquete, opts) {
  const { agenda } = paquete;
  const anio = esc(agenda.anio || '');
  const pag = opts.paginaBase + 2;
  const total = opts.totalPaginas;
  const requisitos = paquete.analisis_requisitos_json || [];

  const nivelesActivos = new Set(
    (paquete.niveles_digitalizacion || []).map(n => n.nivel)
  );
  if (paquete.nivel_digitalizacion_actual != null) {
    nivelesActivos.add(paquete.nivel_digitalizacion_actual);
  }

  const nivelesDef = [
    { num: 1, desc: 'La información del trámite o servicio está publicada en medios electrónicos' },
    { num: 2, desc: 'Los formatos del trámite o servicio están disponibles electrónicamente' },
    { num: 3, desc: 'El usuario puede iniciar la gestión, recibir o enviar información del trámite' },
    { num: 4, desc: 'El trámite o servicio se gestiona desde el inicio hasta el final a través de un medio electrónico' },
  ];

  return `
    <article class="page-sheet doc-item" data-doc-title="Hoja 2" id="doc-2-f${paquete.id_ficha}">
      <div>
        ${renderEncabezadoStandard(agenda)}
        <div class="flex justify-between items-baseline mb-2">
          <h2 class="text-xs font-bold text-gray-900 uppercase">III. ANÁLISIS DE LA OPERACIÓN</h2>
          <span class="text-[11px] font-mono font-bold text-gray-700">FASD 08 ${anio}</span>
        </div>
        <table class="gov-table text-[9.5px] mb-3">
          <thead>
            <tr><th class="py-1 bg-gray-100" colspan="2">Situación actual</th></tr>
            <tr>
              <th class="w-1/2 py-1 font-bold">Requisitos:</th>
              <th class="w-1/2 py-1 font-bold">Observaciones / Problemas Detectados con los requisitos</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="p-2 align-top">
                <ol class="list-decimal pl-4 space-y-1">
                  ${requisitos.map(r => `<li>${esc(r.requisito || '')}</li>`).join('')}
                </ol>
              </td>
              <td class="p-2 align-top">
                ${requisitos.map(r => `
                  <div class="flex items-start gap-1.5 mb-1">
                    <span class="font-bold text-blue-900">☑</span>
                    <p class="text-gray-800 leading-relaxed">${esc(r.observacion || '')}</p>
                  </div>`).join('')}
              </td>
            </tr>
          </tbody>
        </table>
        <div class="border border-gray-700 p-2 mb-3 text-[10px] bg-gray-50">
          <span class="font-bold block mb-0.5">En caso de existir condicionantes, favor de indicarlas:</span>
          <p class="text-gray-800">${esc(paquete.condiciones_o_criterios_de_resolucion || 'No aplica')}</p>
        </div>
        <div class="flex justify-between items-baseline mb-1">
          <h2 class="text-xs font-bold text-gray-900 uppercase">IV. MATRIZ DE DIAGNÓSTICO</h2>
        </div>
        <table class="gov-table text-[9.5px] mb-3">
          <thead>
            <tr><th colspan="2" class="py-1">Indique el nivel de digitalización del trámite o servicio.</th></tr>
          </thead>
          <tbody>
            ${nivelesDef.map(n => `
              <tr>
                <td class="w-12 text-center font-bold ${nivelesActivos.has(n.num) ? 'bg-amber-50' : ''}">Nivel ${n.num}</td>
                <td class="p-1.5">
                  <label class="flex items-center gap-2 font-medium cursor-pointer">
                    <input class="rounded text-gray-800" type="checkbox" ${chk(nivelesActivos.has(n.num))}/>
                    ${esc(n.desc)}
                  </label>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div class="flex justify-between items-baseline mb-1">
          <h2 class="text-xs font-bold text-gray-900 uppercase">V. HALLAZGOS Y OPORTUNIDADES</h2>
        </div>
        <div class="border border-gray-700 text-[10px] mb-2">
          <div class="grid grid-cols-12 border-b border-gray-700">
            <div class="col-span-4 p-1.5 font-bold bg-gray-100 border-r border-gray-700">Dónde están los cuellos de botella detectados:</div>
            <div class="col-span-8 p-1.5 text-gray-800">${esc(paquete.cuellos_de_botella || 'No aplica')}</div>
          </div>
          <div class="grid grid-cols-12 border-b border-gray-700">
            <div class="col-span-4 p-1.5 font-bold bg-gray-100 border-r border-gray-700">Qué requisitos no agregan valor al resolutivo del trámite o servicio:</div>
            <div class="col-span-8 p-1.5 text-gray-800">${esc(paquete.requisitos_sin_valor || 'No aplica')}</div>
          </div>
          <div class="grid grid-cols-12">
            <div class="col-span-4 p-1.5 font-bold bg-gray-100 border-r border-gray-700">Indique propuesta de mejora a los problemas detectados:</div>
            <div class="col-span-8 p-1.5 text-gray-800 font-medium">${esc(paquete.propuestas_de_mejora || '')}</div>
          </div>
        </div>
      </div>
      <div>${renderFirmas(agenda, pag, total, false)}</div>
    </article>`;
}

// ─── HOJA 3: FASD 09 ─── Checklists del catálogo completo ────────────────────

function renderHoja3(paquete, todasAcciones, opts) {
  const { agenda, acciones } = paquete;
  const anio = esc(agenda.anio || '');
  const pag = opts.paginaBase + 3;
  const total = opts.totalPaginas;

  const accionesVinculadasIds = new Set(
    (acciones || []).map(a => a.id_accion && a.id_accion.id_accion)
  );

  const simplificacion = todasAcciones.filter(a => a.simplificacion_o_digitalizacion === true);
  const digitalizacion = todasAcciones.filter(a => a.simplificacion_o_digitalizacion === false);

  const renderTablaChecklist = (lista) => lista.map((accion, idx) => {
    const aplica = accionesVinculadasIds.has(accion.id_accion);
    return `
      <tr>
        <td class="text-center font-bold">${idx + 1}</td>
        <td>${esc(accion.titulo || '')}</td>
        <td class="text-center ${aplica ? 'font-bold text-blue-900' : ''}">${aplica ? '☑' : '☐'}</td>
      </tr>`;
  }).join('');

  return `
    <article class="page-sheet doc-item" data-doc-title="Hoja 3" id="doc-3-f${paquete.id_ficha}">
      <div>
        ${renderEncabezadoStandard(agenda)}
        <div class="flex justify-between items-baseline mb-2">
          <h2 class="text-xs font-bold text-gray-900 uppercase">VI. ACCIONES DE SIMPLIFICACIÓN Y/O DIGITALIZACIÓN</h2>
          <span class="text-[11px] font-mono font-bold text-gray-700">FASD 09 ${anio}</span>
        </div>
        <div class="mb-2">
          <h3 class="text-[11px] font-bold text-gray-900 mb-1 bg-gray-100 p-1 border border-gray-700">VI.I Acciones de Simplificación</h3>
          <table class="gov-table text-[9.5px]">
            <thead>
              <tr>
                <th class="w-8 text-center py-1">No</th>
                <th class="text-left py-1">Acción de Simplificación</th>
                <th class="w-16 text-center py-1">Aplica</th>
              </tr>
            </thead>
            <tbody>
              ${simplificacion.length === 0
                ? '<tr><td colspan="3" class="text-center text-gray-500 p-2">Sin acciones de simplificación en el catálogo</td></tr>'
                : renderTablaChecklist(simplificacion)}
            </tbody>
          </table>
        </div>
        <div class="mb-3">
          <h3 class="text-[11px] font-bold text-gray-900 mb-1 bg-gray-100 p-1 border border-gray-700">VI.II Acciones de Digitalización</h3>
          <table class="gov-table text-[9.5px]">
            <thead>
              <tr>
                <th class="w-8 text-center py-1">No</th>
                <th class="text-left py-1">Acción de Digitalización</th>
                <th class="w-16 text-center py-1">Aplica</th>
              </tr>
            </thead>
            <tbody>
              ${digitalizacion.length === 0
                ? '<tr><td colspan="3" class="text-center text-gray-500 p-2">Sin acciones de digitalización en el catálogo</td></tr>'
                : renderTablaChecklist(digitalizacion)}
            </tbody>
          </table>
        </div>
      </div>
      <div>${renderFirmas(agenda, pag, total, false)}</div>
    </article>`;
}

// ─── HOJA 5 y 6: FASD 04/05 ─── Gantt por tipo de acción ─────────────────────

function renderHojaGantt(paquete, opts, tipo) {
  const { agenda, tramite, acciones } = paquete;
  const esSimpl = tipo === 'simplificacion';
  const fasdCod = esSimpl ? '04' : '05';
  const tituloSeccion = esSimpl
    ? 'VII. Cronología de Integración de la Agenda de Simplificación'
    : 'VIII. Cronología de Integración de la Agenda de Digitalización';

  // Hoja 5 (FASD 04) es la 4ª página de la ficha; Hoja 6 (FASD 05) es la 5ª página.
  const hojaNumAttr = esSimpl ? 5 : 6;
  const numPaginaDeFicha = esSimpl ? 4 : 5;
  const pag = opts.paginaBase + numPaginaDeFicha;
  const total = opts.totalPaginas;
  const meses = getMesesSemestre(agenda.semestre);

  const accionesFiltradas = (acciones || []).filter(a => {
    const s = a.id_accion && a.id_accion.simplificacion_o_digitalizacion;
    return esSimpl ? s === true : s === false;
  });

  const renderGanttTabla = (accionItem) => {
    const accion = accionItem.id_accion;
    const actividades = accionItem.actividades || [];
    if (actividades.length === 0) return '';

    const filasActividades = actividades.map((act, idx) => {
      const crono = act.cronograma || {};
      const inicio = crono.num_mes_inicio_plazo;
      const fin = crono.num_mes_final_plazo;

      const celdasMes = [1, 2, 3, 4, 5, 6].map(mesNum => {
        const activo = inicio != null && fin != null && inicio > 0 && fin > 0
          && mesNum >= inicio && mesNum <= fin;
        return `<td class="text-center ${activo ? 'bg-gray-700 text-white font-bold' : ''}">${activo ? '✓' : ''}</td>`;
      }).join('');

      const entregablesHtml = (act.entregables || [])
        .map(e => `- ${esc(e.titulo || '')}<br/>`)
        .join('');

      return `
        <tr>
          <td class="text-center font-bold">${idx + 1}</td>
          <td class="font-medium">${esc(act.titulo || '')}</td>
          ${celdasMes}
          <td class="text-[8px] leading-relaxed">${entregablesHtml}</td>
        </tr>`;
    }).join('');

    return `
      <div class="border border-gray-700 text-[10px] mb-2">
        <div class="grid grid-cols-12 border-b border-gray-700">
          <div class="col-span-4 p-1.5 font-bold bg-gray-50 border-r border-gray-700">Nombre del Trámite o Servicio:</div>
          <div class="col-span-8 p-1.5">${esc(tramite.nombre_oficial || '')}</div>
        </div>
        <div class="grid grid-cols-12">
          <div class="col-span-4 p-1.5 font-bold bg-gray-50 border-r border-gray-700">Nombre de la acción:</div>
          <div class="col-span-8 p-1.5 font-medium">${esc(accion && accion.titulo || '')}</div>
        </div>
      </div>
      <table class="gov-table text-[9px] mb-4">
        <thead>
          <tr>
            <th class="w-6" rowspan="2">No</th>
            <th class="w-1/3" rowspan="2">Actividades</th>
            <th class="text-center" colspan="6">Meses</th>
            <th class="w-1/3" rowspan="2">Entregables</th>
          </tr>
          <tr class="text-[8px] bg-gray-100">
            ${meses.map(m => `<th class="w-6">${m}</th>`).join('')}
          </tr>
        </thead>
        <tbody>${filasActividades}</tbody>
      </table>`;
  };

  const contenidoAcciones = accionesFiltradas.length === 0
    ? `<p class="text-[10px] text-gray-500 italic p-4 text-center border border-gray-300 rounded">Sin acciones de ${tipo} vinculadas a esta ficha.</p>`
    : accionesFiltradas.map(renderGanttTabla).join('');

  return `
    <article class="page-sheet doc-item" data-doc-title="Hoja ${hojaNumAttr}" id="doc-${hojaNumAttr}-f${paquete.id_ficha}">
      <div>
        ${renderEncabezadoFASD(agenda, fasdCod)}
        <div class="text-center mb-2">
          <h2 class="text-xs font-bold text-gray-900">${tituloSeccion}</h2>
        </div>
        ${contenidoAcciones}
      </div>
      <div>${renderFirmas(agenda, pag, total, !esSimpl)}</div>
    </article>`;
}

// ─── Función principal: construir HTML de 5 hojas para una ficha ──────────────

export function construirHtmlCompilacionFicha(paquete, todasAcciones, opts = {}) {
  const paginaBase = opts.paginaBase ?? 0;
  const totalPaginas = opts.totalPaginas ?? 5;
  const optsNorm = { paginaBase, totalPaginas };

  return [
    renderHoja1(paquete, optsNorm),
    renderHoja2(paquete, optsNorm),
    renderHoja3(paquete, todasAcciones, optsNorm),
    renderHojaGantt(paquete, optsNorm, 'simplificacion'), // id="doc-5" (Hoja 5)
    renderHojaGantt(paquete, optsNorm, 'digitalizacion'),  // id="doc-6" (Hoja 6, 2 revisores)
  ].join('\n');
}

// ─── HTML envolvente (head + tailwind + estilos impresión idénticos a fix1.html) ───

function envolverDocumento(cuerpoHtml, titulo, totalFichas = 1) {
  const totalPaginasDocumento = totalFichas * 5;
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${esc(titulo)}</title>
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"><\/script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brandGold: '#b38e44',
            brandDark: '#1a1a1a',
            govGray: '#374151'
          }
        }
      }
    }
  <\/script>
  <style data-purpose="print-and-page-geometry">
    @page {
      size: letter portrait;
      margin: 0;
    }
    @media print {
      html, body {
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 215.9mm !important;
        height: auto !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      #documents-root, main {
        padding: 0 !important;
        margin: 0 !important;
        width: 215.9mm !important;
        max-width: none !important;
      }
      .no-print {
        display: none !important;
      }
      .page-sheet {
        box-shadow: none !important;
        border: none !important;
        margin: 0 !important;
        padding: 10mm 12mm 8mm 12mm !important;
        width: 215.9mm !important;
        max-width: 215.9mm !important;
        box-sizing: border-box !important;
        min-height: 279.4mm !important;
        page-break-after: always;
        break-after: page;
      }
      .page-sheet:last-child {
        page-break-after: avoid;
        break-after: avoid;
      }
    }
    .page-sheet {
      width: 215.9mm;
      min-height: 279.4mm;
      margin: 0 auto 2rem auto;
      background-color: #ffffff;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      box-sizing: border-box;
      padding: 10mm 12mm 8mm 12mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
  </style>
  <style data-purpose="table-borders-and-typography">
    .gov-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #1f2937;
      font-size: 9.5px;
      line-height: 1.2;
    }
    .gov-table th, .gov-table td {
      border: 1px solid #374151;
      padding: 3px 5px;
      vertical-align: middle;
    }
    .gov-table th {
      background-color: #f3f4f6;
      font-weight: 700;
      color: #111827;
      text-align: center;
    }
  </style>
</head>
<body class="bg-slate-100 text-gray-900 font-sans antialiased min-h-screen">
  <header class="no-print sticky top-0 z-50 bg-white border-b border-gray-200 shadow-md">
    <div class="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-2.5 h-7 bg-amber-600 rounded-sm"></div>
        <div>
          <h1 class="text-sm sm:text-base font-bold text-gray-900 leading-tight">Plataforma Oficial FASD</h1>
          <p class="text-xs text-gray-500">Documento Completo (${totalPaginasDocumento} Hojas — ${totalFichas} ficha${totalFichas !== 1 ? 's' : ''}) — Tuxtla Gutiérrez</p>
        </div>
      </div>
      <div class="flex items-center gap-3 flex-wrap">
        <label class="text-xs font-semibold text-gray-700" for="doc-selector">Hoja:</label>
        <select class="text-xs border-gray-300 rounded-md py-1.5 px-3 bg-gray-50 text-gray-800 font-medium" id="doc-selector" onchange="filterDocuments(this.value)">
          <option value="all">Ver Las 5 Hojas (Modo Completo)</option>
          <option value="doc-1">Hoja 1: FASD 07 (Información General y Fundamento Jurídico)</option>
          <option value="doc-2">Hoja 2: FASD 08 (Análisis, Matriz y Hallazgos)</option>
          <option value="doc-3">Hoja 3: FASD 09 (Acciones de Simplificación y Digitalización)</option>
          <option value="doc-5">Hoja 5: FASD 04 (Cronología de Simplificación)</option>
          <option value="doc-6">Hoja 6: FASD 05 (Cronología de Digitalización)</option>
        </select>
        <button class="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-md shadow transition" onclick="adjustFooterVisibility(); window.print()" type="button">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
          </svg>
          Imprimir / Guardar PDF
        </button>
      </div>
    </div>
  </header>
  <main class="py-6 sm:py-8 px-2 sm:px-4" id="documents-root">
    ${cuerpoHtml}
  </main>
  <script data-purpose="document-filter-interaction">
    var MM_TO_PX = 96 / 25.4;
    var PAGE_LETTER_HEIGHT_PX = 279.4 * MM_TO_PX; // ~1055.874px
    var TOLERANCE_PX = 3;

    function waitForAssets() {
      return new Promise(function(resolve) {
        var promises = [];
        if (document.fonts && document.fonts.ready) {
          promises.push(document.fonts.ready);
        }
        var imgs = Array.from(document.images);
        imgs.forEach(function(img) {
          if (!img.complete) {
            promises.push(new Promise(function(resImg) {
              img.onload = resImg;
              img.onerror = resImg;
            }));
          }
        });
        Promise.all(promises).then(resolve);
      });
    }

    function adjustFooterVisibility() {
      var sheets = document.querySelectorAll('.page-sheet');
      sheets.forEach(function(sheet) {
        var footer = sheet.querySelector('.doc-footer');
        if (!footer) return;

        footer.style.display = '';

        var origPadding = sheet.style.padding;
        var origBoxSizing = sheet.style.boxSizing;
        sheet.style.padding = '10mm 12mm 8mm 12mm';
        sheet.style.boxSizing = 'border-box';

        var actualHeight = sheet.scrollHeight;

        sheet.style.padding = origPadding;
        sheet.style.boxSizing = origBoxSizing;

        if (actualHeight > (PAGE_LETTER_HEIGHT_PX + TOLERANCE_PX)) {
          footer.style.display = 'none';
        } else {
          footer.style.display = '';
        }
      });
    }

    function runAdjustmentProcess() {
      waitForAssets().then(function() {
        if (window.requestAnimationFrame) {
          window.requestAnimationFrame(function() {
            adjustFooterVisibility();
          });
        } else {
          adjustFooterVisibility();
        }
      });
    }

    function filterDocuments(selectedVal) {
      const items = document.querySelectorAll('.doc-item');
      if (selectedVal === 'all') {
        items.forEach(function(doc) { doc.style.display = 'flex'; });
      } else {
        items.forEach(function(doc) {
          var matches = doc.id.startsWith(selectedVal + '-') || doc.id === selectedVal;
          doc.style.display = matches ? 'flex' : 'none';
        });
      }
      runAdjustmentProcess();
    }

    window.addEventListener('load', runAdjustmentProcess);
    window.addEventListener('beforeprint', adjustFooterVisibility);
  <\/script>
</body>
</html>`;
}

// ─── Cargar catálogo completo de acciones (paginado) ──────────────────────────

async function cargarTodasLasAcciones() {
  let acciones = [];
  let nextPage = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await api.get(CONFIG.ENDPOINTS.ACCIONES, { page: nextPage, page_size: 100 });
    const results = res.results || res || [];
    acciones = acciones.concat(Array.isArray(results) ? results : []);
    hasMore = !!(res.next);
    nextPage++;
  }

  return acciones;
}

// ─── API PÚBLICA ─────────────────────────────────────────────────────────────

export async function generarHojaIndividual(idFicha, codigoHoja) {
  const codUpper = String(codigoHoja).toUpperCase().replace(/\s+/g, '');
  const necesitaAcciones = codUpper === 'FASD09' || codUpper === 'HOJA3' || codUpper === '3';

  const [paquete, todasAcciones] = await Promise.all([
    api.get(`${CONFIG.ENDPOINTS.FICHAS}${idFicha}/paquete-documental/`),
    necesitaAcciones ? cargarTodasLasAcciones() : Promise.resolve([]),
  ]);

  const optsNorm = { paginaBase: 0, totalPaginas: 1 };
  let htmlHoja = '';
  let nombreHoja = codigoHoja;

  if (codUpper === 'FASD07' || codUpper === 'HOJA1' || codUpper === '1') {
    htmlHoja = renderHoja1(paquete, optsNorm);
    nombreHoja = 'FASD 07 (Hoja 1)';
  } else if (codUpper === 'FASD08' || codUpper === 'HOJA2' || codUpper === '2') {
    htmlHoja = renderHoja2(paquete, optsNorm);
    nombreHoja = 'FASD 08 (Hoja 2)';
  } else if (codUpper === 'FASD09' || codUpper === 'HOJA3' || codUpper === '3') {
    htmlHoja = renderHoja3(paquete, todasAcciones, optsNorm);
    nombreHoja = 'FASD 09 (Hoja 3)';
  } else if (codUpper === 'FASD04' || codUpper === 'HOJA5' || codUpper === '5') {
    htmlHoja = renderHojaGantt(paquete, optsNorm, 'simplificacion');
    nombreHoja = 'FASD 04 (Hoja 5)';
  } else if (codUpper === 'FASD05' || codUpper === 'HOJA6' || codUpper === '6') {
    htmlHoja = renderHojaGantt(paquete, optsNorm, 'digitalizacion');
    nombreHoja = 'FASD 05 (Hoja 6)';
  } else {
    throw new Error(`Código de hoja no reconocido: ${codigoHoja}`);
  }

  const titulo = `${nombreHoja} — Ficha #${idFicha} — ${paquete.tramite?.nombre_oficial || ''}`;
  abrirEnVentana(envolverDocumento(htmlHoja, titulo, 1));
}

export async function generarDocumentoFicha(idFicha) {
  const [paquete, todasAcciones] = await Promise.all([
    api.get(`${CONFIG.ENDPOINTS.FICHAS}${idFicha}/paquete-documental/`),
    cargarTodasLasAcciones(),
  ]);

  const titulo = `FASD ${paquete.agenda?.anio || ''} — Ficha #${idFicha} — ${paquete.tramite?.nombre_oficial || ''}`;
  const cuerpo = construirHtmlCompilacionFicha(paquete, todasAcciones, { paginaBase: 0, totalPaginas: 5 });
  abrirEnVentana(envolverDocumento(cuerpo, titulo, 1));
}

export async function generarDocumentoAgenda(idAgenda) {
  let fichas = [];
  let nextPage = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await api.get(CONFIG.ENDPOINTS.FICHAS, {
      id_agenda: idAgenda,
      page: nextPage,
      page_size: 100,
    });
    const results = res.results || res || [];
    fichas = fichas.concat(Array.isArray(results) ? results : []);
    hasMore = !!(res.next);
    nextPage++;
  }

  if (fichas.length === 0) {
    throw new Error(
      'Esta agenda no tiene fichas diagnósticas registradas. ' +
      'Capture al menos una ficha antes de generar el documento.'
    );
  }

  fichas.sort((a, b) => a.id_ficha - b.id_ficha);

  const [todasAcciones, ...paquetes] = await Promise.all([
    cargarTodasLasAcciones(),
    ...fichas.map(f =>
      api.get(`${CONFIG.ENDPOINTS.FICHAS}${f.id_ficha}/paquete-documental/`)
    ),
  ]);

  const totalPaginas = fichas.length * 5;
  const bloquesHtml = paquetes.map((paquete, idx) =>
    construirHtmlCompilacionFicha(paquete, todasAcciones, {
      paginaBase: idx * 5,
      totalPaginas,
    })
  );

  const agenda0 = paquetes[0]?.agenda;
  const titulo = `FASD ${agenda0?.anio || ''} — Agenda #${idAgenda} — Compilación (${fichas.length} fichas)`;
  abrirEnVentana(envolverDocumento(bloquesHtml.join('\n'), titulo, fichas.length));
}

function abrirEnVentana(htmlCompleto) {
  const blob = new Blob([htmlCompleto], { type: 'text/html; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const ventana = window.open(url, '_blank');
  if (!ventana) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
