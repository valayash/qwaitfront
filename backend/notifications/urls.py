from django.urls import path
from .views import SendNotificationAPIView

urlpatterns = [
    path('send/', SendNotificationAPIView.as_view(), name='send_notification_api'),
] 