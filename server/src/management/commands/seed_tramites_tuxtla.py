import csv
import os
from collections import defaultdict

from django.core.management.base import BaseCommand
from django.db import transaction

from src.models import TramiteOServicio, TramiteTipoAtencion


# Ruta al archivo de datos relativa a este módulo
CSV_PATH = os.path.join(
    os.path.dirname(__file__),
    'data',
    'tramites_seed_source.csv',
)

# Catálogo de tipos de atención válidos (según TramiteTipoAtencion.TIPO_CHOICES)
TIPOS_ATENCION_VALIDOS = {
    TramiteTipoAtencion.TIPO_PRESENCIAL,      # 0
    TramiteTipoAtencion.TIPO_VIA_TELEFONICA,  # 1
    TramiteTipoAtencion.TIPO_VIA_DIGITAL,     # 2
}


class Command(BaseCommand):
    help = (
        'Siembra el catálogo oficial de los 144 trámites municipales del '
        'H. Ayuntamiento de Tuxtla Gutiérrez de forma idempotente. '
        'Fuente: tramites_seed_source.csv'
    )

    def handle(self, *args, **options):
        tramites_creados = 0
        tramites_existentes = 0
        tipos_atencion_creados = 0
        filas_leidas = 0
        por_dependencia = defaultdict(int)

        with transaction.atomic():
            with open(CSV_PATH, newline='', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)

                for fila in reader:
                    filas_leidas += 1

                    # -- Datos del trámite --
                    dependencia_origen = fila['dependencia_origen'].strip()
                    clave = fila['clave'].strip()
                    nombre_oficial = fila['nombre_oficial'].strip()
                    descripcion = fila['descripcion'].strip()
                    # La columna tramite_o_servicio contiene "TRUE" en las 144 filas
                    # (todos son trámites en el documento fuente — ver especificación sección 2)
                    tramite_o_servicio_val = True

                    # -- get_or_create por clave (criterio de idempotencia) --
                    tramite_obj, created = TramiteOServicio.objects.get_or_create(
                        clave=clave,
                        defaults={
                            'nombre_oficial': nombre_oficial,
                            'descripcion': descripcion,
                            'tramite_o_servicio': tramite_o_servicio_val,
                            'objetivo': None,   # CSV no trae objetivo
                            'tipo': None,        # Campo deprecado — no poblar
                            'created_by': None,
                        }
                    )

                    if created:
                        tramites_creados += 1
                        por_dependencia[dependencia_origen] += 1

                        # -- Tipos de atención (solo para trámites recién creados) --
                        raw_tipos = fila['tipos_atencion_ids'].strip()

                        # Parsear tokens separados por "|" o token único
                        if raw_tipos:
                            tokens = [t.strip() for t in raw_tipos.split('|') if t.strip()]
                        else:
                            tokens = []

                        for token in tokens:
                            try:
                                tipo_int = int(token)
                            except ValueError:
                                self.stderr.write(
                                    self.style.WARNING(
                                        f'  [AVISO] Clave {clave}: token de tipo_atencion '
                                        f'no numérico ignorado: "{token}"'
                                    )
                                )
                                continue

                            if tipo_int not in TIPOS_ATENCION_VALIDOS:
                                self.stderr.write(
                                    self.style.WARNING(
                                        f'  [AVISO] Clave {clave}: valor de tipo_atencion '
                                        f'fuera de rango ignorado: {tipo_int}'
                                    )
                                )
                                continue

                            _, created_tipo = TramiteTipoAtencion.objects.get_or_create(
                                id_tramite_servicio=tramite_obj,
                                tipo=tipo_int,
                            )
                            if created_tipo:
                                tipos_atencion_creados += 1

                    else:
                        tramites_existentes += 1
                        # Trámite ya existente: no tocamos sus tipos de atención
                        # para preservar cambios manuales hechos desde la interfaz.

        # ── Resumen final ────────────────────────────────────────────────────
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSiembra de trámites municipales de Tuxtla Gutiérrez completada:\n'
                f'  Filas leídas del CSV  : {filas_leidas}\n'
                f'  Trámites creados      : {tramites_creados}\n'
                f'  Trámites ya existentes: {tramites_existentes} (no se modificaron)\n'
                f'  Tipos de atención     : {tipos_atencion_creados} filas creadas en tramites_has_tipos'
            )
        )

        if por_dependencia:
            self.stdout.write('\nTrámites creados por dependencia de origen:')
            for dep, count in sorted(por_dependencia.items(), key=lambda x: -x[1]):
                self.stdout.write(f'  {dep:<50} {count:>3} trámite(s)')
        else:
            self.stdout.write(
                self.style.WARNING(
                    '\nNingún trámite fue creado en esta ejecución '
                    '(todos ya existían — ejecución idempotente).'
                )
            )
