from .models import WaitlistEntry
# from restaurant_app.models import Restaurant # Old import
from auth_settings.models import Restaurant # New import
import qrcode
import base64
from io import BytesIO
import logging

def get_formatted_waitlist_entries(restaurant_obj):
    """Get a list of formatted waitlist entries for a restaurant.
    Returns formatted entries, total count, and reservation count.
    """
    # Filter for entries associated with the given restaurant object
    reservation_entries = WaitlistEntry.objects.filter(
        restaurant=restaurant_obj,
        status='WAITING',
        notes__icontains="Reservation for"  # Case-insensitive search for reservation notes
    ).order_by('timestamp')
    
    regular_entries = WaitlistEntry.objects.filter(
        restaurant=restaurant_obj,
        status='WAITING'
    ).exclude(
        notes__icontains="Reservation for"
    ).order_by('timestamp')
    
    # Combine querysets, reservations first
    combined_entries = list(reservation_entries) + list(regular_entries)
    
    formatted_entries_list = []
    for index, entry in enumerate(combined_entries, 1):
        # Assuming WaitlistEntry model has a property 'wait_time_minutes'
        wait_time = entry.wait_time_minutes if hasattr(entry, 'wait_time_minutes') else 0
        
        formatted_entries_list.append({
            'id': entry.id,
            'pos': index,  # Position in the displayed list
            'customer_name': entry.customer_name,
            'name': entry.customer_name,  # Alternative field name for compatibility
            'phone_number': entry.phone_number or '',
            'phone': entry.phone_number or '',  # Alternative field name
            'people_count': entry.people_count,
            'party_size': entry.people_count,  # Alternative field name
            'size': entry.people_count,  # For backward compatibility
            'timestamp': entry.timestamp.strftime('%Y-%m-%d %H:%M:%S') if entry.timestamp else '',
            'arrival': entry.timestamp.strftime('%H:%M') if entry.timestamp else '', # Arrival time
            'created_at': entry.timestamp.strftime('%Y-%m-%d %H:%M:%S') if entry.timestamp else '', # Full creation timestamp
            'quoted_time': entry.quoted_time or '',
            'notes': entry.notes or '',
            'wait_time_minutes': wait_time,
            'wait_time': wait_time, # Alternative field name
            'status': entry.status,
            'status_display': entry.get_status_display() # Human-readable status
        })
        
    return formatted_entries_list, len(combined_entries), len(reservation_entries)

# Set up logging if not already configured at app/project level
# logger = logging.getLogger(__name__) # Can be scoped to this module if needed

def generate_qr_code(data, size=10):
    """
    Generates a QR code image for the provided data URL.
    Returns base64 encoded image data.
    """
    logger = logging.getLogger(__name__) # Get logger instance inside function or at module level
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=size,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return f"data:image/png;base64,{img_str}"
    except Exception as e:
        logger.error(f"Error generating QR code: {str(e)}")
        return None 