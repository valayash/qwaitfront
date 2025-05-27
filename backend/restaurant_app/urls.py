from django.urls import path, include
from .views import (
    # Base views for main pages
    dashboard, waitlist_view, recent_activity, settings_view, update_settings, parties, analytics,
    
    # Waitlist views
    update_columns, add_party, remove_entry, mark_as_served, edit_entry, edit_party,
    get_entry, get_recent_activity, refresh_queue_view, api_waitlist_data, api_qrcode,
    
    # Reservation views
    reservations, add_reservation, edit_reservation, delete_reservation, 
    check_in_reservation, get_reservation,
    
    # Customer views
    customer_home, scan_qr, join_queue, join_queue_submit, queue_confirmation, 
    queue_status, leave_queue, api_join_queue, api_queue_confirmation,
    
    # API utilities
    get_restaurant, api_check_phone, api_entry_status, api_waitlist_entry,
    
    # Utility views
    generate_qr_code, send_notification, get_analytics,
)

# Group URLs by page they relate to
urlpatterns = [
    # Main page endpoints
    path('dashboard/', dashboard, name='dashboard'),
    
    # Waitlist page endpoints
    path('waitlist/', waitlist_view, name='waitlist'),
    path('waitlist/entry/<int:entry_id>/', get_entry, name='get_entry'),
    path('waitlist/entry/<int:entry_id>/edit/', edit_entry, name='edit_entry'),
    path('waitlist/entry/<int:entry_id>/remove/', remove_entry, name='remove_entry'),
    path('waitlist/entry/<int:entry_id>/serve/', mark_as_served, name='mark_as_served'),
    path('waitlist/entry/<int:entry_id>/status/', api_entry_status, name='api_entry_status'),
    path('waitlist/party/<int:entry_id>/edit/', edit_party, name='edit_party'),
    path('waitlist/update-columns/', update_columns, name='update_columns'),
    path('waitlist/add-party/', add_party, name='add_party'),
    path('waitlist/refresh/', refresh_queue_view, name='refresh_queue'),
    
    # Recent Activity page endpoints
    path('recent-activity/', recent_activity, name='recent_activity'),
    
    # Settings page endpoints
    path('settings/', settings_view, name='settings'),
    path('settings/update/', update_settings, name='update_settings'),
    
    # Reservations page endpoints
    path('reservations/', reservations, name='reservations'),
    path('reservations/add/', add_reservation, name='add_reservation'),
    path('reservations/<int:reservation_id>/', get_reservation, name='get_reservation'),
    path('reservations/<int:reservation_id>/edit/', edit_reservation, name='edit_reservation'),
    path('reservations/<int:reservation_id>/delete/', delete_reservation, name='delete_reservation'),
    path('reservations/<int:reservation_id>/check-in/', check_in_reservation, name='check_in_reservation'),
    
    # Parties page endpoints
    path('parties/', parties, name='parties'),
    
    # Analytics page endpoints
    path('analytics/', analytics, name='analytics'),
    
    # Restaurant API endpoints 
    path('restaurant/<int:restaurant_id>/', get_restaurant, name='api_restaurant'),
    path('restaurant/<int:restaurant_id>/check-phone/<str:phone_number>/', api_check_phone, name='api_check_phone'),
    
    # QR code endpoints
    path('qrcode/', api_qrcode, name='api_qrcode'),
    path('qrcode/<int:restaurant_id>/', generate_qr_code, name='generate_qr_code'),
    
    # Customer-facing queue endpoints
    path('join-queue/<int:restaurant_id>/', join_queue, name='join_queue'),
    path('join-queue/<int:restaurant_id>/join/', api_join_queue, name='api_join_queue'),
    path('join-queue/<int:restaurant_id>/submit/', join_queue_submit, name='join_queue_submit'),
    path('join-queue/<int:restaurant_id>/queue-confirmation/<int:queue_entry_id>/', queue_confirmation, name='queue_confirmation'),
    path('join-queue/<int:restaurant_id>/queue/<int:queue_entry_id>/status/', queue_status, name='queue_status'),
    path('join-queue/<int:restaurant_id>/queue/<int:queue_entry_id>/leave/', leave_queue, name='leave_queue'),
    
    # Other customer endpoints
    path('customer-home/', customer_home, name='customer_home'),
    path('scan-qr/<int:restaurant_id>/', scan_qr, name='scan_qr'),
]
