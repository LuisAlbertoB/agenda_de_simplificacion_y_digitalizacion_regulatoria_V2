from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.db.models import ProtectedError


def custom_exception_handler(exc, context):
    """
    Manejador global de excepciones para Django REST Framework.
    Captura ProtectedError (on_delete=PROTECT) y responde 400 Bad Request
    con un mensaje claro en español.
    """
    if isinstance(exc, ProtectedError):
        protected_objects = list(exc.protected_objects)
        model_names = set(obj._meta.verbose_name for obj in protected_objects) if protected_objects else []
        model_str = ", ".join(model_names) if model_names else "otros registros"

        msg = f"No se puede eliminar este registro porque ya está vinculado a {model_str} existentes."
        return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)

    # Delegar otras excepciones al manejador por defecto de DRF
    response = exception_handler(exc, context)
    return response
