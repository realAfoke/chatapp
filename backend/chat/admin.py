from django.contrib import admin
from . import models

# Register your models here.
admin.site.register(models.User)
admin.site.register(models.Conversation)
admin.site.register(models.Message)
admin.site.register(models.MessageReaction)
admin.site.register(models.MessageReciept)
admin.site.register(models.ConnectionRequest)
admin.site.register(models.Connection)