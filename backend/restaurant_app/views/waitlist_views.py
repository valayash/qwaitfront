from django.shortcuts import get_object_or_404, render
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST, require_GET
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_protect
from django.utils import timezone
from ..models import Restaurant, QueueEntry
from django.core.exceptions import PermissionDenied
import logging
import json
from datetime import timedelta
from django.utils.timezone import now
from django.conf import settings
import qrcode
from io import BytesIO
import base64

# Set up logging
logger = logging.getLogger(__name__)

# Helper function to format queue entries for the waitlist view
def get_formatted_queue_entries(restaurant):
    """Get a list of formatted queue entries for a restaurant"""
    # Make sure we have a Restaurant object, not a QuerySet
    if hasattr(restaurant, 'model') and restaurant.model == QueueEntry:
        # A QueueEntry QuerySet was passed instead of a Restaurant
        if restaurant.exists():
            # Get the first entry's restaurant
            first_entry = restaurant.first()
            restaurant = first_entry.restaurant
        else:
            # Empty QuerySet, can't determine restaurant
            return []
    
    # First, identify entries from reservations by their notes field
    reservation_entries = QueueEntry.objects.filter(
        restaurant=restaurant,
        status='WAITING',
        notes__contains="Reservation for"
    ).order_by('timestamp')
    
    # Then, get all other regular entries
    regular_entries = QueueEntry.objects.filter(
        restaurant=restaurant,
        status='WAITING'
    ).exclude(
        notes__contains="Reservation for"
    ).order_by('timestamp')
    
    # Combine the two querysets with reservations first
    queue_entries = list(reservation_entries) + list(regular_entries)
    
    formatted_entries = []
    for index, entry in enumerate(queue_entries, 1):
        # Format entries with consistent field names that match frontend expectations
        formatted_entries.append({
            'id': entry.id,
            'pos': index,
            'customer_name': entry.customer_name,
            'name': entry.customer_name,  # Add alternate field name for compatibility
            'phone_number': entry.phone_number or '',
            'phone': entry.phone_number or '',  # Add alternate field name for compatibility
            'people_count': entry.people_count,
            'party_size': entry.people_count,  # Add alternate field name for compatibility 
            'size': entry.people_count,  # Keep for backward compatibility
            'timestamp': entry.timestamp.strftime('%Y-%m-%d %H:%M:%S') if entry.timestamp else '',
            'arrival': entry.timestamp.strftime('%H:%M') if entry.timestamp else '',
            'created_at': entry.timestamp.strftime('%Y-%m-%d %H:%M:%S') if entry.timestamp else '',
            'quoted_time': entry.quoted_time or '',
            'notes': entry.notes or '',
            'wait_time_minutes': entry.wait_time_minutes,
            'wait_time': entry.wait_time_minutes,  # Add alternate field name for compatibility
            'status': entry.status,
        })
    return formatted_entries

@login_required
@require_POST
def update_columns(request):
    """API endpoint to update waitlist columns."""
    restaurant = request.user.restaurant
    try:
        data = json.loads(request.body)
        selected_columns = data.get('columns', [])
        restaurant.waitlist_columns = selected_columns
        restaurant.save()
        return JsonResponse({'success': True})
    except Exception as e:
        logger.error(f"Error updating columns: {str(e)}")
        return JsonResponse({'error': str(e)}, status=400)

@login_required
@require_POST
def add_party(request):
    """API endpoint to add a party to the waitlist."""
    restaurant = get_object_or_404(Restaurant, user=request.user)

    try:
        data = json.loads(request.body)
        customer_name = data.get('customer_name')
        phone_number = data.get('phone_number')
        people_count = data.get('people_count')
        quoted_time = data.get('quoted_time')
        notes = data.get('notes', '')

        # Validate required fields
        if not all([customer_name, phone_number, people_count]):
            return JsonResponse({'error': "All fields are required."}, status=400)

        try:
            people_count = int(people_count)
            if people_count <= 0:
                return JsonResponse({'error': "Party size must be positive."}, status=400)
            quoted_time = int(quoted_time) if quoted_time else None
        except ValueError as e:
            return JsonResponse({'error': str(e)}, status=400)

        # Create and save QueueEntry
        entry = QueueEntry.objects.create(
            restaurant=restaurant,
            customer_name=customer_name,
            phone_number=phone_number,
            people_count=people_count,
            timestamp=timezone.now(),
            quoted_time=quoted_time,
            notes=notes,
            status='WAITING'
        )

        return JsonResponse({
            'success': True,
            'entry': {
                'id': entry.id,
                'customer_name': entry.customer_name,
                'phone_number': entry.phone_number,
                'people_count': entry.people_count,
                'quoted_time': entry.quoted_time,
                'notes': entry.notes,
                'status': entry.status
            }
        })

    except Exception as e:
        logger.error(f"Error in add_party: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@csrf_protect
@require_POST
def remove_entry(request, entry_id):
    """API endpoint to remove a queue entry."""
    entry = get_object_or_404(QueueEntry, id=entry_id)
    restaurant = entry.restaurant
    
    if request.user != restaurant.user:
        raise PermissionDenied
    
    entry.delete()
    
    # Get updated queue entries and count
    queue_entries = QueueEntry.objects.filter(restaurant=restaurant, status='WAITING')
    count = queue_entries.count()
    
    return JsonResponse({
        'success': True,
        'message': f'Party {entry.customer_name} has been removed from the queue.'
    })

@login_required
@csrf_protect
@require_POST
def mark_as_served(request, entry_id):
    """API endpoint to mark a queue entry as served."""
    entry = get_object_or_404(QueueEntry, id=entry_id)
    restaurant = entry.restaurant
    
    if request.user != restaurant.user:
        raise PermissionDenied
    
    entry.status = 'SERVED'
    entry.save()
    
    # Get updated queue entries and count
    queue_entries = QueueEntry.objects.filter(restaurant=restaurant, status='WAITING')
    count = queue_entries.count()
    
    return JsonResponse({
        'success': True,
        'message': f'Party {entry.customer_name} has been marked as served.'
    })

@login_required
@require_POST
def edit_entry(request, entry_id):
    """API endpoint to edit a queue entry's details."""
    entry = get_object_or_404(QueueEntry, id=entry_id, restaurant__user=request.user)
    
    try:
        data = json.loads(request.body)
        
        # Update entry fields
        if 'customer_name' in data:
            entry.customer_name = data['customer_name']
        if 'phone_number' in data:
            entry.phone_number = data['phone_number']
        if 'people_count' in data:
            entry.people_count = data['people_count']
        
        entry.save()
        
        # Get updated queue entries
        queue_entries = QueueEntry.objects.filter(restaurant=entry.restaurant, status='WAITING')
        
        return JsonResponse({
            'success': True,
            'message': f"{entry.customer_name}'s details were updated."
        })
    except Exception as e:
        logger.error(f"Error in edit_entry: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@login_required
@require_POST
def edit_party(request, entry_id):
    """API endpoint to edit a party's details (expanded version with more fields)."""
    entry = get_object_or_404(QueueEntry, id=entry_id, restaurant__user=request.user)
    
    try:
        data = json.loads(request.body)
        
        # Update entry fields
        if 'customer_name' in data:
            entry.customer_name = data['customer_name']
        if 'phone_number' in data:
            entry.phone_number = data['phone_number']
        if 'people_count' in data:
            entry.people_count = int(data['people_count'])
        if 'quoted_time' in data:
            entry.quoted_time = int(data['quoted_time']) if data['quoted_time'] else None
        if 'notes' in data:
            entry.notes = data['notes']
        
        entry.save()
        
        # Get updated queue entries
        queue_entries = QueueEntry.objects.filter(restaurant=entry.restaurant, status='WAITING')
        
        return JsonResponse({
            'success': True,
            'message': f"Party {entry.customer_name} has been updated."
        })
    except Exception as e:
        logger.error(f"Error in edit_party: {str(e)}")
        return JsonResponse({
            'success': False, 
            'message': str(e)
        }, status=400)

@login_required
@require_GET
def recent_activity(request):
    """API endpoint to get recent waitlist activity."""
    restaurant = get_object_or_404(Restaurant, user=request.user)
    recent_time_threshold = now() - timedelta(days=7)

    # Filter for served and removed entries
    recent_entries = QueueEntry.objects.filter(
        restaurant=restaurant,
        timestamp__gte=recent_time_threshold,
        status__in=['SERVED', 'REMOVED']
    ).order_by('-timestamp')[:20]
    
    # Format the entries for the response
    entries_data = [{
        'id': entry.id,
        'customer_name': entry.customer_name,
        'phone_number': entry.phone_number,
        'people_count': entry.people_count,
        'timestamp': entry.timestamp.isoformat() if entry.timestamp else None,
        'completion_time': entry.completion_time.isoformat() if hasattr(entry, 'completion_time') and entry.completion_time else None,
        'status': entry.status
    } for entry in recent_entries]
    
    return JsonResponse({
        'success': True,
        'entries': entries_data
    })

@login_required
@require_GET
def get_entry(request, entry_id):
    """API endpoint to get queue entry details."""
    entry = get_object_or_404(QueueEntry, id=entry_id)
    
    data = {
        'customer_name': entry.customer_name,
        'phone_number': entry.phone_number,
        'people_count': entry.people_count,
        'quoted_time': entry.quoted_time,
        'notes': entry.notes
    }
    return JsonResponse(data)

@login_required
@require_GET
def get_recent_activity(request):
    """API endpoint to get recent activity."""
    restaurant = get_object_or_404(Restaurant, user=request.user)
    recent_time_threshold = now() - timedelta(days=7)

    recent_entries = QueueEntry.objects.filter(
        restaurant=restaurant,
        timestamp__gte=recent_time_threshold,
        status__in=['SERVED', 'REMOVED'],
    ).order_by('-timestamp')[:20]

    entries_data = [{
        'id': entry.id,
        'customer_name': entry.customer_name,
        'phone_number': entry.phone_number,
        'people_count': entry.people_count,
        'timestamp': entry.timestamp.isoformat() if entry.timestamp else None,
        'status': entry.status
    } for entry in recent_entries]

    return JsonResponse({
        'success': True,
        'entries': entries_data
    })

@login_required
@require_GET
def queue_updates(request, queue_entry_id):
    """Stream queue position updates to clients using server-sent events"""
    def event_stream():
        while True:
            # Get the queue entry
            try:
                queue_entry = QueueEntry.objects.get(id=queue_entry_id, status='WAITING')
                
                # Calculate the current position
                current_position = QueueEntry.objects.filter(
                    restaurant=queue_entry.restaurant,
                    status='WAITING',
                    timestamp__lte=queue_entry.timestamp
                ).count()
                
                # Calculate the estimated wait time
                wait_time = 15 * (current_position - 1)  # Minutes
                estimated_wait_time = timezone.now() + timedelta(minutes=wait_time)
                
                # Format the response
                data = {
                    'queue_position': current_position,
                    'estimated_time': estimated_wait_time.strftime('%I:%M %p')
                }
                
                # Send the event
                yield f"data: {json.dumps(data)}\n\n"
                
                # Sleep for 10 seconds before the next update
                import time
                time.sleep(10)
                
            except QueueEntry.DoesNotExist:
                # If entry doesn't exist or is no longer waiting, exit
                yield f"data: {json.dumps({'status': 'removed'})}\n\n"
                break
                
            except Exception as e:
                # Log any errors and continue
                print(f"Error in queue_updates: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                time.sleep(10)
    
    return StreamingHttpResponse(event_stream(), content_type='text/event-stream')

@login_required
@require_GET
def refresh_queue_view(request):
    """
    Provides a JSON response with current queue entries for AJAX refreshing.
    """
    # Get the restaurant for the current user
    try:
        restaurant = Restaurant.objects.get(user=request.user)
    except Restaurant.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'No restaurant found'})
        
    # First, identify entries from reservations by their notes field
    reservation_entries = QueueEntry.objects.filter(
        restaurant=restaurant,
        status__in=['WAITING', 'NOTIFIED'],
        notes__contains="Reservation for"  # This matches our format in check_in_reservation
    ).order_by('timestamp')  # Show oldest reservation check-ins first
    
    # Then, get all other regular entries
    regular_entries = QueueEntry.objects.filter(
        restaurant=restaurant,
        status__in=['WAITING', 'NOTIFIED']
    ).exclude(
        notes__contains="Reservation for"
    ).order_by('timestamp')  # Show oldest regular entries first
    
    # Combine the two querysets with reservations first
    queue_entries = list(reservation_entries) + list(regular_entries)
    
    # Format queue entries as JSON-serializable objects
    formatted_entries = []
    for index, entry in enumerate(queue_entries, 1):
        wait_time_minutes = entry.wait_time_minutes if hasattr(entry, 'wait_time_minutes') else 0
        
        formatted_entries.append({
            'id': entry.id,
            'party_size': entry.people_count,
            'name': entry.customer_name,
            'phone': entry.phone_number or '',
            'pos': index,
            'customer_name': entry.customer_name,
            'phone_number': entry.phone_number or '',
            'size': entry.people_count,
            'arrival': entry.timestamp.strftime('%H:%M') if entry.timestamp else '',
            'created_at': entry.timestamp.strftime('%Y-%m-%d %H:%M:%S') if entry.timestamp else '',
            'quoted_time': entry.quoted_time or '',
            'notes': entry.notes or '',
            'wait_time': wait_time_minutes,
            'wait_time_minutes': wait_time_minutes,  
            'status': entry.status,
            'status_display': entry.get_status_display()
        })
    
    return JsonResponse({
        'success': True, 
        'entries': formatted_entries,
        'count': len(formatted_entries)
    })

@login_required
@require_GET
def api_waitlist_data(request):
    """
    API endpoint that returns waitlist data in JSON format for the React frontend
    Also handles adding new parties when received as a POST request
    """
    restaurant = Restaurant.objects.get(user=request.user)
    
    # Handle POST request to add a new party
    if request.method == 'POST':
        try:
            data = json.loads(request.body) if request.body else request.POST
            customer_name = data.get('customer_name')
            phone_number = data.get('phone_number')
            people_count = data.get('people_count')
            quoted_time = data.get('quoted_time')
            notes = data.get('notes', '')
            
            # Validate required fields
            if not all([customer_name, phone_number, people_count]):
                return JsonResponse({
                    'success': False,
                    'message': 'Missing required fields'
                }, status=400)
            
            try:
                # Convert to integers
                people_count = int(people_count)
                quoted_time = int(quoted_time) if quoted_time else None
                
                if people_count <= 0:
                    raise ValueError("Party size must be positive")
            except ValueError as e:
                return JsonResponse({
                    'success': False,
                    'message': str(e)
                }, status=400)
            
            # Create new queue entry
            entry = QueueEntry.objects.create(
                restaurant=restaurant,
                customer_name=customer_name,
                phone_number=phone_number,
                people_count=people_count,
                timestamp=timezone.now(),
                quoted_time=quoted_time,
                notes=notes,
                status='WAITING'
            )
            
            # Get updated queue entries for Socket.IO update
            queue_entries = QueueEntry.objects.filter(
                restaurant=restaurant, 
                status='WAITING'
            ).order_by('timestamp')
            
            # Return success response
            return JsonResponse({
                'success': True,
                'message': f'Party added successfully. Quoted wait time: {quoted_time if quoted_time else "Not set"} minutes',
                'entry_id': entry.id
            })
            
        except Exception as e:
            logger.error(f"Error adding party via API: {str(e)}")
            return JsonResponse({
                'success': False,
                'message': f'Error adding party: {str(e)}'
            }, status=500)
    
    # Handle GET request to fetch waitlist data
    # First, identify entries from reservations by their notes field
    reservation_entries = QueueEntry.objects.filter(
        restaurant=restaurant,
        status='WAITING',
        notes__contains="Reservation for"
    ).order_by('timestamp')
    
    # Then, get all other regular entries
    regular_entries = QueueEntry.objects.filter(
        restaurant=restaurant,
        status='WAITING'
    ).exclude(
        notes__contains="Reservation for"
    ).order_by('timestamp')
    
    # Combine the two querysets with reservations first
    queue_entries = list(reservation_entries) + list(regular_entries)
    
    # Build JSON data structure
    entries_data = []
    for entry in queue_entries:
        # Calculate wait time in minutes
        if entry.timestamp:
            now = timezone.now()
            wait_time = int((now - entry.timestamp).total_seconds() // 60)
        else:
            wait_time = 0
            
        entries_data.append({
            'id': entry.id,
            'customer_name': entry.customer_name,
            'phone_number': entry.phone_number,
            'people_count': entry.people_count,
            'timestamp': entry.timestamp.strftime("%H:%M"),
            'wait_time_minutes': wait_time,
            'status': entry.status,
            'notes': entry.notes,
        })
    
    # Generate QR code with React frontend URL
    join_url = f"{settings.FRONTEND_URL}/join-queue/{restaurant.id}"
    qr = qrcode.make(join_url)
    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    response_data = {
        'restaurant': {
            'id': restaurant.id,
            'name': restaurant.name,
            'waitlist_columns': restaurant.waitlist_columns or ['notes', 'arrival_time', 'status'],
        },
        'queue_entries': entries_data,
        'queue_count': len(queue_entries),
        'reservations_count': len(reservation_entries),
        'qr_code': f"data:image/png;base64,{qr_base64}",
        'join_url': join_url,
    }
    
    return JsonResponse(response_data)

@login_required
@require_GET
def api_qrcode(request):
    """
    API endpoint that returns QR code data in JSON format for the React frontend
    """
    restaurant = Restaurant.objects.get(user=request.user)
    
    # Generate QR code with React frontend URL
    join_url = f"{settings.FRONTEND_URL}/join-queue/{restaurant.id}"
    qr = qrcode.make(join_url)
    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    response_data = {
        'qr_code': f"data:image/png;base64,{qr_base64}",
        'join_url': join_url,
    }
    
    return JsonResponse(response_data) 


# waitlist_app/views.py
from rest_framework import generics, status
from rest_framework.response import Response
from ..models import QueueEntry
from ..serializers import QueueEntrySerializer

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from ..consumers import WAITLIST_GROUP_NAME # Import the group name

class WaitlistEntryListCreateView(generics.ListCreateAPIView):
    queryset = QueueEntry.objects.filter(status="Waiting").order_by('submitted_at')
    serializer_class = QueueEntrySerializer

    def perform_create(self, serializer):
        # Save the new entry
        instance = serializer.save()

        # Prepare data for WebSocket message
        # Use the serializer to ensure consistent data format
        message_data = QueueEntrySerializer(instance).data

        # Get the channel layer
        channel_layer = get_channel_layer()

        # Send message to the waitlist group
        async_to_sync(channel_layer.group_send)(
            WAITLIST_GROUP_NAME,
            {
                'type': 'send.waitlist.update', # This will call send_waitlist_update in consumer
                'data': message_data
            }
        )
        print(f"Sent update to group {WAITLIST_GROUP_NAME}")