import os
import sys
from pathlib import Path
from datetime import timedelta
from decouple import Config, RepositoryEnv, Csv

BASE_DIR = Path(__file__).resolve().parent.parent

ENV_FILE = BASE_DIR / 'db_config' / '.env'
config = Config(RepositoryEnv(str(ENV_FILE)))

SECRET_KEY = config('SECRET_KEY', default='django-insecure-agenda-regulatoria-dev-key')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())


INSTALLED_APPS = [
    # Django core
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',                           # Django REST Framework
    'rest_framework_simplejwt',                 # JWT Authentication
    'rest_framework_simplejwt.token_blacklist', # Token blacklist (logout/rotación)
    'corsheaders',                              # CORS headers

    # Local app
    'src.apps.SrcConfig',                       # Nuestra app principal
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',             # CORS — debe ir primero
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'src.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'src.wsgi.application'


DB_ENGINE = config('DB_ENGINE', default='postgresql')

if 'test' in sys.argv or DB_ENGINE.lower() == 'sqlite':
    # SQLite para tests o desarrollo local rápido
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    # PostgreSQL para producción y desarrollo con Docker
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME':     config('DB_NAME',     default='agenda_regulatoria_db'),
            'USER':     config('DB_USER',     default='postgres'),
            'PASSWORD': config('DB_PASSWORD', default='postgres'),
            'HOST':     config('DB_HOST',     default='localhost'),
            'PORT':     config('DB_PORT',     default='5432'),
        }
    }


# Modelo de usuario personalizado (tabla usuarios del SQL)
AUTH_USER_MODEL = 'src.Usuario'


PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',   # ← Bcrypt primario
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.ScryptPasswordHasher',
]


REST_FRAMEWORK = {
    # Autenticación por defecto: JWT
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # Por defecto, todas las rutas requieren autenticación
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    # Paginación global
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,

    # Renderers y parsers
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ),
    'DEFAULT_PARSER_CLASSES': (
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ),

    # Formato de fechas
    'DATETIME_FORMAT': '%Y-%m-%dT%H:%M:%SZ',

    # Manejador global de excepciones (ProtectedError -> 400 Bad Request)
    'EXCEPTION_HANDLER': 'src.middlewares.exception_handler.custom_exception_handler',
}


SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(seconds=config('ACCESS_TOKEN_LIFETIME',  default=1800,   cast=int)),
    'REFRESH_TOKEN_LIFETIME': timedelta(seconds=config('REFRESH_TOKEN_LIFETIME', default=604800, cast=int)),

    # Rotar refresh token en cada uso (más seguro)
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,

    # Algoritmo de firma
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,

    # Headers del token
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',

    # Claims del token — usamos id_usuario como PK
    'USER_ID_FIELD': 'id_usuario',
    'USER_ID_CLAIM': 'user_id',

    # Serializer personalizado para inyectar claims extras
    'TOKEN_OBTAIN_SERIALIZER': 'src.services.auth_serializer.CustomTokenObtainPairSerializer',
}


CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://localhost:5173',
    cast=Csv()
)


AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


LANGUAGE_CODE = 'es-mx'
TIME_ZONE = 'America/Mexico_City'
USE_I18N = True
USE_TZ = True


STATIC_URL = 'static/'


MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
