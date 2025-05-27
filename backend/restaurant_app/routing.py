# waitlist_app/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # General waitlist, if still needed and if it doesn't conflict.
    # Consider removing if all waitlist access is restaurant-specific.
    # re_path(r'ws/waitlist/$', consumers.WaitlistConsumer.as_asgi()), 

    # Route for restaurant-specific waitlist updates, matching frontend
    # NO TRAILING SLASH to match ws/waitlist/ID
    re_path(r'ws/waitlist/(?P<restaurant_id>\w+)$', consumers.WaitlistConsumer.as_asgi()), 
]