from django.apps import AppConfig


class PartiesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'parties'

    def ready(self):
        import parties.signals # Import signals here
