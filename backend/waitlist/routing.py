from django.urls import re_path
# Assuming WaitlistConsumer is still in restaurant_app.consumers
# If you move WaitlistConsumer to waitlist.consumers, change this import.
from . import consumers # Updated import to use local consumers

websocket_urlpatterns = [
    # Route for restaurant-specific waitlist updates
    # Path: /ws/waitlist/<restaurant_id>
    re_path(r'ws/waitlist/(?P<restaurant_id>\w+)$', consumers.WaitlistConsumer.as_asgi()),
] 