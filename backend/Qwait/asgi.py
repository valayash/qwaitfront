"""
ASGI config for Qwait project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""
# myproject/asgi.py
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack # If you need authentication for websockets
import restaurant_app.routing # Import your app's routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Qwait.settings')

# Get the default Django ASGI application
django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app, # Handles standard HTTP requests
    "websocket": AuthMiddlewareStack( # Or just URLRouter if no auth needed on WS
        URLRouter(
            restaurant_app.routing.websocket_urlpatterns
        )
    ),
})


