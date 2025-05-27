from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.views.decorators.http import require_GET, require_POST
from django.db.models import Q
from datetime import timedelta
from ..models import Restaurant, QueueEntry
from .waitlist_views import get_formatted_queue_entries
import json
import logging
import re

# Import Django signals
from django.dispatch import Signal

# Define a new signal
queue_entry_created = Signal()

# Set up logging
logger = logging.getLogger(__name__)

@require_GET
def customer_home(request):
    """API endpoint for customer home page data."""
    return JsonResponse({
        'success': True,
        'message': 'Welcome to Qwait API'
    })

@require_GET
def scan_qr(request, restaurant_id):
    """
    API endpoint for QR code scanning.
    Returns restaurant info and redirects to join queue.
    """
    restaurant = get_object_or_404(Restaurant, id=restaurant_id)
    
    return JsonResponse({
        'success': True,
        'restaurant': {
            'id': restaurant.id,
            'name': restaurant.name
        },
        'redirect_url': f"/join-queue/{restaurant_id}/"
    })

@require_GET
def join_queue(request, restaurant_id):
    """
    API endpoint for join queue page data.
    Returns restaurant info and current queue size.
    """
    restaurant = get_object_or_404(Restaurant, id=restaurant_id)
    
    # Check if customer has come from a QR code scan or direct link
    referrer = request.META.get('HTTP_REFERER', '')
    is_qr_scan = 'qr' in referrer or request.GET.get('qr') == '1'
    
    return JsonResponse({
        'success': True,
        'restaurant': {
            'id': restaurant.id,
            'name': restaurant.name,
            'address': restaurant.address,
            'phone': restaurant.phone
        },
        'is_qr_scan': is_qr_scan,
        'queue_size': QueueEntry.objects.filter(restaurant=restaurant, status='WAITING').count()
    })

@csrf_exempt
@require_POST
def join_queue_submit(request, restaurant_id):
    """
    API endpoint for submitting join queue form.
    Handles validation and queue entry creation.
    """
    restaurant = get_object_or_404(Restaurant, id=restaurant_id)
    
    try:
        if request.content_type == 'application/json':
            data = json.loads(request.body)
        else:
            data = request.POST
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON data'}, status=400)
    
    customer_name = data.get('customer_name')
    phone_number = data.get('phone_number')
    people_count = data.get('people_count')
    notes = data.get('notes', '')
    
    # Validate required fields
    if not all([customer_name, phone_number, people_count]):
        return JsonResponse({
            'success': False,
            'error': 'Please fill all required fields',
            'validation_errors': {
                'customer_name': [] if customer_name else ['This field is required'],
                'phone_number': [] if phone_number else ['This field is required'],
                'people_count': [] if people_count else ['This field is required']
            }
        }, status=400)
    
    # Clean and format the phone number (remove non-digit characters)
    clean_phone = re.sub(r'\D', '', phone_number)
    
    # Check if this phone is already in the queue
    existing_entry = QueueEntry.objects.filter(
        restaurant=restaurant,
        phone_number__contains=clean_phone,
        status='WAITING'
    ).first()
    
    if existing_entry:
        return JsonResponse({
            'success': False,
            'error': f"This phone number is already in the queue (for {existing_entry.customer_name})",
            'duplicate': True,
            'entry_id': existing_entry.id
        }, status=409)
    
    # Create the queue entry
    try:
        # Format the phone number for storage (retaining original format)
        entry = QueueEntry.objects.create(
            restaurant=restaurant,
            customer_name=customer_name,
            phone_number=phone_number,
            people_count=int(people_count),
            notes=notes,
            status='WAITING',
            timestamp=timezone.now()
        )
        
        # Calculate position and wait time
        queue_entries = QueueEntry.objects.filter(
            restaurant=restaurant, 
            status='WAITING'
        ).order_by('timestamp')
        
        position = 0
        for i, e in enumerate(queue_entries):
            if e.id == entry.id:
                position = i + 1
                break
                
        # Calculate estimated wait time - handle missing avg_wait_time attribute
        avg_wait_time = getattr(restaurant, 'avg_wait_time', 15)  # Default to 15 minutes
        estimated_wait = position * avg_wait_time
        
        # Send the signal
        queue_entry_created.send(sender=QueueEntry, instance=entry, restaurant=restaurant)
        
        return JsonResponse({
            'success': True,
            'queue_entry_id': entry.id,
            'position': position,
            'estimated_wait_time': estimated_wait,
            'redirect_url': f"/join-queue/{restaurant_id}/queue-confirmation/{entry.id}/"
        })
            
    except Exception as e:
        logger.error(f"Error in join_queue_submit: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Error adding to queue. Please try again.',
            'details': str(e)
        }, status=500)

@require_GET
def queue_confirmation(request, restaurant_id, queue_entry_id):
    """
    API endpoint for queue confirmation page data.
    Returns entry details, position in line, and estimated wait time.
    """
    restaurant = get_object_or_404(Restaurant, id=restaurant_id)
    entry = get_object_or_404(QueueEntry, id=queue_entry_id, restaurant=restaurant)
    
    # Verify this entry is still active
    if entry.status != 'WAITING':
        # Entry was canceled or served already
        return JsonResponse({
            'success': True,
            'restaurant': {
                'id': restaurant.id,
                'name': restaurant.name
            },
            'queue_entry': {
                'id': entry.id,
                'customer_name': entry.customer_name,
                'status': entry.status
            },
            'position': 0,
            'estimated_wait_time': 0,
            'active': False
        })
    
    # Calculate position in line
    queue_entries = QueueEntry.objects.filter(
        restaurant=restaurant, 
        status='WAITING'
    ).order_by('timestamp')
    
    position = 0
    for i, e in enumerate(queue_entries):
        if e.id == entry.id:
            position = i + 1
            break
    
    # Calculate estimated wait time
    avg_wait_time = getattr(restaurant, 'avg_wait_time', 15)  # Default to 15 minutes
    estimated_wait = position * avg_wait_time
    
    return JsonResponse({
        'success': True,
        'restaurant': {
            'id': restaurant.id,
            'name': restaurant.name,
            'address': restaurant.address,
            'phone': restaurant.phone
        },
        'queue_entry': {
            'id': entry.id,
            'customer_name': entry.customer_name,
            'phone_number': entry.phone_number,
            'people_count': entry.people_count,
            'timestamp': entry.timestamp.isoformat() if entry.timestamp else None,
            'status': entry.status
        },
        'position': position,
        'estimated_wait_time': estimated_wait,
        'queue_size': queue_entries.count()
    })

@require_GET
def queue_status(request, restaurant_id, entry_id):
    """
    API endpoint for checking queue status.
    Returns real-time position in line and estimated wait time.
    """
    restaurant = get_object_or_404(Restaurant, id=restaurant_id)
    
    try:
        entry = get_object_or_404(QueueEntry, id=entry_id, restaurant=restaurant)
    except:
        # If entry not found, return error
        return JsonResponse({
            'success': False,
            'error': 'Queue entry not found',
            'restaurant': {
                'id': restaurant.id,
                'name': restaurant.name
            }
        }, status=404)
    
    # Verify this entry is still active
    if entry.status != 'WAITING':
        # Entry was canceled or served already
        return JsonResponse({
            'success': True,
            'restaurant': {
                'id': restaurant.id,
                'name': restaurant.name
            },
            'entry': {
                'id': entry.id,
                'customer_name': entry.customer_name,
                'status': entry.status
            },
            'position': 0,
            'wait_time': 0,
            'active': False
        })
    
    # Calculate position in line
    queue_entries = QueueEntry.objects.filter(
        restaurant=restaurant, 
        status='WAITING'
    ).order_by('timestamp')
    
    position = 0
    for i, e in enumerate(queue_entries):
        if e.id == entry.id:
            position = i + 1
            break
    
    # Calculate estimated wait time
    avg_wait_time = getattr(restaurant, 'avg_wait_time', 15)  # Default to 15 minutes
    estimated_wait = position * avg_wait_time
    
    # Calculate time in queue
    time_in_queue = timezone.now() - entry.timestamp
    minutes_in_queue = int(time_in_queue.total_seconds() / 60)
    
    return JsonResponse({
        'success': True,
        'restaurant': {
            'id': restaurant.id,
            'name': restaurant.name
        },
        'entry': {
            'id': entry.id,
            'customer_name': entry.customer_name,
            'phone_number': entry.phone_number,
            'people_count': entry.people_count,
            'timestamp': entry.timestamp.isoformat() if entry.timestamp else None,
            'status': entry.status
        },
        'position': position,
        'wait_time': estimated_wait,
        'queue_size': queue_entries.count(),
        'minutes_in_queue': minutes_in_queue,
        'active': True
    })

@csrf_exempt
@require_POST
def leave_queue(request, restaurant_id, entry_id):
    """
    API endpoint for leaving the queue.
    Marks entry as canceled and updates the queue.
    """
    restaurant = get_object_or_404(Restaurant, id=restaurant_id)
    entry = get_object_or_404(QueueEntry, id=entry_id, restaurant=restaurant)
    
    if entry.status != 'WAITING':
        return JsonResponse({'success': False, 'error': 'Entry is not active'}, status=400)
    
    # Mark as canceled
    entry.status = 'CANCELED'
    entry.completion_time = timezone.now()
    entry.save()
    
    # Update queue
    queue_entries = QueueEntry.objects.filter(
        restaurant=restaurant,
        status='WAITING'
    ).order_by('timestamp')
    
    return JsonResponse({
        'success': True,
        'message': 'You have successfully left the queue',
        'redirect_url': f"/restaurant/{restaurant_id}/queue-left"
    })

@require_GET
def queue_left(request, restaurant_id):
    """API endpoint for queue left confirmation."""
    restaurant = get_object_or_404(Restaurant, id=restaurant_id)
    return JsonResponse({
        'success': True,
        'message': 'You have successfully left the queue',
        'restaurant': {
            'id': restaurant.id,
            'name': restaurant.name
        }
    }) 