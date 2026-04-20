from django.apps import AppConfig


class ExpedientesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.expedientes'

    def ready(self):
        import backend.expedientes.signals