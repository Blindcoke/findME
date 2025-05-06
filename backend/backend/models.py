from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
from pathlib import Path
from django.utils import timezone
import shutil


def get_upload_path(instance, filename):
    base_dir = Path("captives")
    if instance.pk is None:
        return str(base_dir / "temp" / filename)
    return str(base_dir / str(instance.pk) / filename)


class Captive(models.Model):
    PERSON_TYPE_CHOICES = [
        ("military", "Військовий"),
        ("civilian", "Цивільний"),
    ]
    STATUS_CHOICES = [
        ("searching", "Розшукується"),
        ("informed", "Є інформація"),
        ("reunited", "Зустрілися з рідними"),
        ("deceased", "Помер"),
    ]

    name = models.CharField(max_length=100, blank=True, null=True, default="Безіменний")
    picture = models.ImageField(upload_to=get_upload_path, blank=True, null=True)
    person_type = models.CharField(
        max_length=10, choices=PERSON_TYPE_CHOICES, default="civilian"
    )
    brigade = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Заповнюється тільки для військових",
    )
    date_of_birth = models.DateField(blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="searching"
    )
    region = models.CharField(max_length=100, blank=True, null=True)
    settlement = models.CharField(max_length=100, blank=True, null=True)
    circumstances = models.TextField(blank=True, null=True)
    appearance = models.TextField(blank=True, null=True)
    appearance_embedded = models.TextField(blank=True, null=True)
    picture_embedded = models.TextField(blank=True, null=True)
    last_update = models.DateTimeField(default=timezone.now)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_picture_name = None

        if not is_new and self.picture:
            try:
                old_instance = Captive.objects.get(pk=self.pk)
                old_picture_name = (
                    old_instance.picture.name if old_instance.picture else None
                )
            except Captive.DoesNotExist:
                pass

        super().save(*args, **kwargs)

        if self.picture:
            if is_new or (old_picture_name and old_picture_name != self.picture.name):
                current_path = Path(settings.MEDIA_ROOT) / self.picture.name

                new_relative_path = Path("captives") / str(self.pk) / current_path.name
                new_full_path = Path(settings.MEDIA_ROOT) / new_relative_path

                new_full_path.parent.mkdir(parents=True, exist_ok=True)

                if current_path.exists():
                    current_path.rename(new_full_path)
                    self.picture.name = str(new_relative_path)
                    super().save(update_fields=["picture"])

                temp_dir = Path(settings.MEDIA_ROOT) / "captives" / "temp"
                if temp_dir.exists() and not any(temp_dir.iterdir()):
                    shutil.rmtree(temp_dir)

    def delete(self, *args, **kwargs):
        if self.picture:
            try:
                picture_path = Path(settings.MEDIA_ROOT) / self.picture.name
                if picture_path.exists():
                    picture_path.unlink()

                dir_path = picture_path.parent
                if dir_path.exists() and not any(dir_path.iterdir()):
                    shutil.rmtree(dir_path)
            except Exception as e:
                print(f"Error deleting file: {e}")

        return super().delete(*args, **kwargs)

    def __str__(self):
        person_type_dict = dict(self.PERSON_TYPE_CHOICES)
        return (
            f"{self.name} ({person_type_dict.get(self.person_type, self.person_type)})"
        )
