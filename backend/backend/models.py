from django.db import models
from django.contrib.auth.models import User

class Captive(models.Model):
    PERSON_TYPE_CHOICES = [
        ('military', 'Військовий'),
        ('civilian', 'Цивільний'),
    ]
    STATUS_CHOICES = [
        ('searching', 'Розшукується'),
        ('informed', 'Є інформація'),
        ('reunited', 'Зустрілися з рідними'),
        ('deceased', 'Помер'),
    ]

    name = models.CharField(max_length=100, blank=True, null=True)
    picture = models.ImageField(upload_to='captives/', blank=True, null=True)
    person_type = models.CharField(
        max_length=10, 
        choices=PERSON_TYPE_CHOICES, 
        default='civilian'
    )
    brigade = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        help_text="Заповнюється тільки для військових"
    )
    date_of_birth = models.DateField(blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False)
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='searching'
    )
    region = models.CharField(max_length=100, blank=True, null=True)
    settlement = models.CharField(max_length=100, blank=True, null=True)
    circumstances = models.TextField(blank=True, null=True)
    appearance = models.TextField(blank=True, null=True)
    last_update = models.DateTimeField(blank=True, null=True)
    
    def save(self, *args, **kwargs):
        if self.status == 'reunited':
            self.is_active = False
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.get_person_type_display()})"
