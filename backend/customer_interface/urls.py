from django.urls import path
from .views import (
    CustomerHomeAPIView,
    ScanQRAPIView,
    JoinQueueAPIView,
    JoinQueueSubmitAPIView,
    QueueConfirmationAPIView,
    QueueStatusAPIView,
    LeaveQueueAPIView,
    QueueLeftAPIView,
    CheckPhoneAPIView
)

urlpatterns = [
    path('home/', CustomerHomeAPIView.as_view(), name='customer_home_api'),
    path('scan-qr/<int:restaurant_id>/', ScanQRAPIView.as_view(), name='scan_qr_api'),
    path('join-queue/<int:restaurant_id>/', JoinQueueAPIView.as_view(), name='join_queue_api'),
    path('join-queue/<int:restaurant_id>/submit/', JoinQueueSubmitAPIView.as_view(), name='join_queue_submit_api'),
    path('queue-confirmation/<int:restaurant_id>/<int:queue_entry_id>/', QueueConfirmationAPIView.as_view(), name='queue_confirmation_api'),
    path('queue-status/<int:restaurant_id>/<int:entry_id>/', QueueStatusAPIView.as_view(), name='queue_status_api'), # entry_id consistent with view
    path('leave-queue/<int:restaurant_id>/<int:entry_id>/', LeaveQueueAPIView.as_view(), name='leave_queue_api'), # entry_id consistent with view
    path('queue-left/<int:restaurant_id>/', QueueLeftAPIView.as_view(), name='queue_left_api'),
    path('check-phone/<int:restaurant_id>/<str:phone_number>/', CheckPhoneAPIView.as_view(), name='check_phone_api'),
] 