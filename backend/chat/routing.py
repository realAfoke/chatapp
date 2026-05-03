from django.urls import path
from . import consumers

websocket_urlpatterns=[
    path('ws/chat/',consumers.ChatConsumer.as_asgi()),
    path('ws/users/',consumers.ActiveUsers.as_asgi())
]
