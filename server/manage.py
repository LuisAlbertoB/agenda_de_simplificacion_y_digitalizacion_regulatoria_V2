#!/usr/bin/env python
"""
Agenda de Simplificación y Digitalización Regulatoria — Django command-line utility.
Punto de entrada principal del proyecto.
"""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'src.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "No se pudo importar Django. ¿Está instalado y "
            "disponible en la variable de entorno PYTHONPATH? "
            "¿Activaste el entorno virtual?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
