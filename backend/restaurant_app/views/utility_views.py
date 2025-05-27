from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from ..models import Restaurant, QueueEntry
import json
import logging
import io
import qrcode
import base64
import re

# Set up logging
logger = logging.getLogger(__name__)

def generate_qr_code(data, size=10):
    """
    Generates a QR code image for the provided data URL.
    Returns base64 encoded image data.
    """
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
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return f"data:image/png;base64,{img_str}"
    except Exception as e:
        logger.error(f"Error generating QR code: {str(e)}")
        return None

def format_phone_number(phone):
    """
    Formats a phone number into a standard format.
    """
    # Strip all non-numeric characters
    digits = re.sub(r'\D', '', phone)
    
    # Format based on length
    if len(digits) == 10:
        return f"({digits[0:3]}) {digits[3:6]}-{digits[6:10]}"
    elif len(digits) == 11 and digits[0] == '1':
        return f"({digits[1:4]}) {digits[4:7]}-{digits[7:11]}"
    else:
        return phone  # Return original if we can't format

def send_notification_email(entry, position=None, estimated_wait=None):
    """
    Sends a notification email to the restaurant owner when 
    a new customer joins the queue.
    """
    if not settings.EMAIL_ENABLED:
        logger.debug("Email notifications disabled in settings")
        return False
        
    try:
        restaurant = entry.restaurant
        recipient = restaurant.user.email
        
        if not recipient:
            logger.warning(f"No email address for restaurant {restaurant.id} owner")
            return False
            
        # Prepare email context
        context = {
            'restaurant': restaurant,
            'entry': entry,
            'position': position,
            'estimated_wait': estimated_wait,
            'formatted_phone': format_phone_number(entry.phone_number)
        }
        
        # Render email content from template
        subject = f"New Customer in Waitlist: {entry.customer_name}"
        html_message = render_to_string('emails/new_customer.html', context)
        plain_message = render_to_string('emails/new_customer.txt', context)
        
        # Send the email
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            html_message=html_message,
            fail_silently=False
        )
        
        logger.info(f"Notification email sent to {recipient} for entry {entry.id}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending notification email: {str(e)}")
        return False

def send_sms_notification(entry, message=None):
    """
    Sends an SMS notification to the customer.
    Requires Twilio or similar service to be configured.
    """
    if not settings.SMS_ENABLED:
        logger.debug("SMS notifications disabled in settings")
        return False
        
    try:
        # This requires Twilio or similar SMS service to be configured
        from twilio.rest import Client
        
        # Get Twilio credentials from settings
        account_sid = settings.TWILIO_ACCOUNT_SID
        auth_token = settings.TWILIO_AUTH_TOKEN
        from_number = settings.TWILIO_FROM_NUMBER
        
        if not all([account_sid, auth_token, from_number]):
            logger.warning("Twilio credentials not properly configured")
            return False
            
        # Clean phone number (must be E.164 format for Twilio)
        to_number = "+" + re.sub(r'\D', '', entry.phone_number)
        if not to_number.startswith('+1'):
            to_number = '+1' + to_number.lstrip('+')
            
        # Default message if none provided
        if not message:
            message = f"Hello {entry.customer_name}, your table at {entry.restaurant.name} is ready! Please proceed to the host stand."
            
        # Initialize Twilio client and send message
        client = Client(account_sid, auth_token)
        sms = client.messages.create(
            body=message,
            from_=from_number,
            to=to_number
        )
        
        logger.info(f"SMS sent to {to_number} (SID: {sms.sid})")
        
        # Store SMS SID in the entry for tracking
        entry.sms_sid = sms.sid
        entry.save(update_fields=['sms_sid'])
        
        return True
        
    except ImportError:
        logger.error("Twilio package not installed")
        return False
    except Exception as e:
        logger.error(f"Error sending SMS notification: {str(e)}")
        return False

@login_required
def send_notification(request, entry_id):
    """
    View to send a notification to a customer.
    Can send SMS, email, or both based on request parameters.
    """
    entry = get_object_or_404(QueueEntry, id=entry_id, restaurant__user=request.user)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)
        
    try:
        data = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        data = {}
        
    notification_type = data.get('type', 'sms')
    custom_message = data.get('message', '')
    
    success = False
    
    if notification_type in ['sms', 'both']:
        # Send SMS
        message = custom_message or f"Hello {entry.customer_name}, your table at {entry.restaurant.name} is ready! Please proceed to the host stand."
        sms_success = send_sms_notification(entry, message)
        
        if sms_success:
            entry.notified = True
            entry.save(update_fields=['notified'])
            success = True
            
    if notification_type in ['email', 'both']:
        # Send email to customer
        # This would be implemented similar to send_notification_email
        # but for customers instead of restaurant owners
        pass
        
    return JsonResponse({
        'success': success,
        'message': 'Notification sent' if success else 'Failed to send notification'
    })

def analytics_helper(restaurant, days=30):
    """
    Helper function to generate analytics data for a restaurant.
    """
    from django.utils import timezone
    from django.db.models import Avg, Count, F, ExpressionWrapper, fields
    from django.db.models.functions import ExtractHour, TruncDate
    import datetime
    
    # Get date range
    end_date = timezone.now()
    start_date = end_date - datetime.timedelta(days=days)
    
    # Query all relevant entries
    entries = QueueEntry.objects.filter(
        restaurant=restaurant,
        timestamp__gte=start_date,
        timestamp__lte=end_date
    )
    
    # Calculate wait times for completed entries
    wait_time_expr = ExpressionWrapper(
        F('completion_time') - F('timestamp'),
        output_field=fields.DurationField()
    )
    
    completed_entries = entries.filter(
        status__in=['SERVED', 'CANCELED'],
        completion_time__isnull=False
    ).annotate(
        wait_time=wait_time_expr
    )
    
    # Basic metrics
    total_entries = entries.count()
    avg_wait_time = completed_entries.aggregate(
        avg_wait=Avg('wait_time')
    )['avg_wait']
    
    if avg_wait_time:
        avg_wait_minutes = avg_wait_time.total_seconds() / 60
    else:
        avg_wait_minutes = 0
    
    # Entries by status
    status_counts = entries.values('status').annotate(
        count=Count('id')
    ).order_by('status')
    
    # Entries by hour of day
    hourly_data = entries.annotate(
        hour=ExtractHour('timestamp')
    ).values('hour').annotate(
        count=Count('id')
    ).order_by('hour')
    
    # Entries by date
    daily_data = entries.annotate(
        date=TruncDate('timestamp')
    ).values('date').annotate(
        count=Count('id')
    ).order_by('date')
    
    # Cancellation rate
    canceled = entries.filter(status='CANCELED').count()
    cancellation_rate = (canceled / total_entries) * 100 if total_entries > 0 else 0
    
    # Average party size
    avg_party_size = entries.aggregate(
        avg_size=Avg('people_count')
    )['avg_size'] or 0
    
    # Return consolidated analytics data
    return {
        'total_entries': total_entries,
        'avg_wait_minutes': round(avg_wait_minutes, 1),
        'status_counts': list(status_counts),
        'hourly_data': list(hourly_data),
        'daily_data': list(daily_data),
        'cancellation_rate': round(cancellation_rate, 1),
        'avg_party_size': round(avg_party_size, 1)
    }

@login_required
def get_analytics(request, restaurant_id=None):
    """
    View to get analytics data for a restaurant.
    If restaurant_id is not provided, uses the restaurant
    associated with the logged-in user.
    """
    if restaurant_id:
        restaurant = get_object_or_404(Restaurant, id=restaurant_id, user=request.user)
    else:
        restaurant = get_object_or_404(Restaurant, user=request.user)
    
    # Get requested time period (default: 30 days)
    days = request.GET.get('days', 30)
    try:
        days = int(days)
    except (ValueError, TypeError):
        days = 30
    
    # Get analytics data
    data = analytics_helper(restaurant, days)
    
    return JsonResponse(data) 