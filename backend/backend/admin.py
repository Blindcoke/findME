from django.contrib import admin
from .models import Captive


@admin.register(Captive)
class CaptiveAdmin(admin.ModelAdmin):
    list_display = ("name", "brigade", "date_of_birth", "user")
    search_fields = ("name", "brigade")
    list_filter = ("brigade", "user")

    def display_picture(self, obj):
        return (
            f'<img src="{obj.picture.url}" width="50" height="50" />'
            if obj.picture
            else "No image"
        )
