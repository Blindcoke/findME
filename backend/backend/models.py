from django.db import models
from django.contrib.auth.models import User
from django.core.files.storage import default_storage
from pathlib import Path
from django.utils import timezone
import shutil


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

    def get_upload_path(instance, filename):
        # Ensure consistent directory name
        base_dir = Path("captives")
        # Use instance.id if it exists, otherwise use temp
        if instance.id is None:
            return str(base_dir / "temp" / filename)
        return str(base_dir / str(instance.id) / filename)

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
    last_update = models.DateTimeField(default=timezone.now)

    def save(self, *args, **kwargs):
        is_new = self.id is None
        old_picture_name = None

        if not is_new and self.picture:
            try:
                old_instance = Captive.objects.get(pk=self.pk)
                old_picture_name = (
                    old_instance.picture.name if old_instance.picture else None
                )
            except Captive.DoesNotExist:
                pass

        # Save the model first to get the ID
        super().save(*args, **kwargs)

        if self.picture:
            if is_new or (old_picture_name and old_picture_name != self.picture.name):
                # Get the current picture path
                current_path = Path(default_storage.location) / self.picture.name

                # Create the new path
                new_relative_path = Path("captives") / str(self.id) / current_path.name
                new_full_path = Path(default_storage.location) / new_relative_path

                # Ensure directory exists
                new_full_path.parent.mkdir(parents=True, exist_ok=True)

                # Move the file if it exists
                if current_path.exists():
                    current_path.rename(new_full_path)
                    self.picture.name = str(new_relative_path)
                    super().save(update_fields=["picture"])

                # Clean up temp directory if empty
                temp_dir = Path(default_storage.location) / "captives" / "temp"
                if temp_dir.exists() and not any(temp_dir.iterdir()):
                    shutil.rmtree(temp_dir)

    def delete(self, *args, **kwargs):
        if self.picture:
            try:
                picture_path = Path(default_storage.location) / self.picture.name
                if picture_path.exists():
                    picture_path.unlink()

                dir_path = picture_path.parent
                if dir_path.exists() and not any(dir_path.iterdir()):
                    shutil.rmtree(dir_path)
            except Exception as e:
                print(f"Error deleting file: {e}")

        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.get_person_type_display()})"
