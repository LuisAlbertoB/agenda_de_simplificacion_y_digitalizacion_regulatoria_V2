from rest_framework.pagination import PageNumberPagination


class CustomPageNumberPagination(PageNumberPagination):
    """
    Paginador global para Django REST Framework.
    
    - page_size: 10 (por defecto si el cliente no envía `page_size`)
    - page_size_query_param: 'page_size' (permite al cliente solicitar ?page_size=20, 50, etc.)
    - max_page_size: 100 (límite máximo seguro para evitar cargas excesivas de memoria)
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
