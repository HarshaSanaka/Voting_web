from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        from django.db.models.signals import post_migrate
        post_migrate.connect(create_defaults, sender=self)


def create_defaults(sender, **kwargs):
    from django.contrib.auth.models import User
    from api.models import Candidate

    # Create admin superuser: username=Harsha, password=Vardhan
    if not User.objects.filter(username='Harsha').exists():
        User.objects.create_superuser(
            username='Harsha',
            email='harsha@admin.com',
            password='Vardhan'
        )
        print('[OK] Created admin user: Harsha')

    # Create default candidates if none exist
    if Candidate.objects.count() == 0:
        defaults = [
            {'name': 'Alex Johnson', 'department': 'Computer Science'},
            {'name': 'Sarah Williams', 'department': 'Business Admin'},
            {'name': 'Marcus Chen', 'department': 'Engineering'},
        ]
        for c in defaults:
            Candidate.objects.create(**c)
        print('[OK] Created default candidates')
