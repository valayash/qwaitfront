# Import all views from the modular files
# This maintains backwards compatibility for existing imports

# Base views for main pages
from .base_views import (
    dashboard,
    waitlist_view,
    recent_activity,
    settings_view,
    update_settings,
    parties,
    analytics,
)

# Waitlist views
from .waitlist_views import (
    update_columns,
    add_party,
    remove_entry,
    mark_as_served,
    get_entry,
    get_recent_activity,
    refresh_queue_view,
    get_formatted_queue_entries,
    api_waitlist_data,
    api_qrcode,
    edit_entry,
    edit_party,
)

# Reservation views
from .reservation_views import (
    reservations,
    add_reservation,
    edit_reservation,
    delete_reservation,
    check_in_reservation,
    get_reservation,
)

# API views
from .api_views import (
    api_check_phone,
    api_join_queue,
    api_entry_status,
    api_waitlist_entry,
    get_restaurant,
    api_queue_confirmation,
)

# Customer views
from .customer_views import (
    customer_home,
    scan_qr,
    join_queue,
    join_queue_submit,
    queue_confirmation,
    queue_status,
    leave_queue,
)

# Utility views
from .utility_views import (
    generate_qr_code,
    format_phone_number,
    send_notification_email,
    send_sms_notification,
    send_notification,
    get_analytics,
)

# For simplicity in imports, provide a list of all view functions
__all__ = [
    # Base views for main pages
    'dashboard', 'waitlist_view', 'recent_activity', 'settings_view', 
    'update_settings', 'parties', 'analytics',
    
    # Waitlist views
    'update_columns', 'add_party', 'remove_entry', 'mark_as_served', 
    'edit_entry', 'edit_party', 'get_entry', 'get_recent_activity',
    'refresh_queue_view', 'get_formatted_queue_entries', 'api_waitlist_data', 'api_qrcode',
    
    # Reservation views
    'reservations', 'add_reservation', 'edit_reservation',
    'delete_reservation', 'check_in_reservation', 'get_reservation',
    
    # API views
    'api_check_phone', 'api_join_queue', 'api_entry_status', 
    'api_waitlist_entry', 'get_restaurant', 'api_queue_confirmation',
    
    # Customer views
    'customer_home', 'scan_qr', 'join_queue', 'join_queue_submit',
    'queue_confirmation', 'queue_status', 'leave_queue',
    
    # Utility views
    'generate_qr_code', 'format_phone_number', 'send_notification_email',
    'send_sms_notification', 'send_notification', 'get_analytics',
]
