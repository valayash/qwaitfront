"""
URL configuration for Qwait project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# from django.views.generic import TemplateView # Not currently used
from django.contrib import admin
from django.urls import path, include # include is important
from . import views # For the home view
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # path('admin/', admin.site.urls), # Temporarily commented out
    path('api/', views.home, name='home'), # Changed to /api/ as a base for API calls
    
    # Authentication URLs are now in auth_settings.urls
    path('api/auth/', include('auth_settings.urls')), # Include auth URLs under /api/auth/
    path('api/customer/', include('customer_interface.urls')), # New line
    # path('register/', views.register_view, name='register'), # Old - Removed
    # path('login/', views.login_view, name='login'),       # Old - Removed
    # path('logout/', views.logout_view, name='logout'),     # Old - Removed
    
    # App-specific URLs
    # path('', include('restaurant_app.urls')), # Keep if restaurant_app still has root URLs, or namespace it e.g. 'api/restaurant/'
    path('api/restaurant/', include('restaurant_app.urls')), # Example namespacing for restaurant_app
    path('api/waitlist/', include('waitlist.urls')),
    path('api/', include('reservation.urls')), # Include reservation URLs
    path('api/notifications/', include('notifications.urls')), # Added notifications URLs
    # Add other app URLs here as they are refactored, e.g.:
    # path('api/parties/', include('parties.urls')),
    # path('api/analytics/', include('analytics.urls')),
    # path('api/recent/', include('recent.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
