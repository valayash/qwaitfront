# waitlist_app/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/waitlist/$', consumers.WaitlistConsumer.as_asgi()),
    # Add other WebSocket paths here if needed
]