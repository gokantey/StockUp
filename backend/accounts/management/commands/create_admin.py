from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create the first admin account for R&J'

    def handle(self, *args, **kwargs):
        self.stdout.write('\n── R&J First Admin Setup ──\n')

        email     = input('Email: ').strip().lower()
        full_name = input('Full name: ').strip()
        password  = input('Password (min 8 chars): ').strip()

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.ERROR(f'\nA user with email {email} already exists.'))
            return

        if len(password) < 8:
            self.stdout.write(self.style.ERROR('\nPassword must be at least 8 characters.'))
            return

        User.objects.create_user(
            email=email,
            full_name=full_name,
            password=password,
            role='admin',
            is_staff=True,
            is_superuser=True,
        )
        self.stdout.write(self.style.SUCCESS(f'\nAdmin account created for {email}. You can now log in.\n'))