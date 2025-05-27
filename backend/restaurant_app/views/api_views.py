from django.shortcuts import get_object_or_404
from django.http import JsonResponse, HttpResponseNotAllowed, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from ..models import Restaurant, QueueEntry
import json
import logging
import re

# Set up logging
logger = logging.getLogger(__name__)

@csrf_exempt
def api_check_phone(request, restaurant_id, phone_number):
    """
    API endpoint to check if a phone number exists in the waitlist.
    This is called from the customer-facing JoinQueue component to prevent duplicate entries.
    """
    if request.method != 'GET':
        logger.warning(f"Method not allowed in api_check_phone: {request.method}")
        return HttpResponseNotAllowed(['GET'])
    
    # Log the phone number being checked
    logger.debug(f"Checking phone number {phone_number} for restaurant ID {restaurant_id}")
    
    # Get the restaurant
    try:
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
    except Exception as e:
        logger.error(f"Error retrieving restaurant {restaurant_id}: {str(e)}")
        return JsonResponse({'error': f"Restaurant not found: {str(e)}"}, status=404)
    
    # Check if the phone number exists in active queue entries
    entry = QueueEntry.objects.filter(
        restaurant=restaurant,
        phone_number__contains=phone_number,
        status='WAITING'
    ).first()
    
    # Log the response data
    response_data = {'exists': entry is not None}
    if entry:
        response_data['entry_id'] = entry.id
        response_data['customer_name'] = entry.customer_name
        logger.debug(f"Found existing entry with ID {entry.id} for phone {phone_number}")
    else:
        logger.debug(f"No existing entry found for phone {phone_number}")
    
    return JsonResponse(response_data)

@csrf_exempt
def api_join_queue(request, restaurant_id):
    """
    API endpoint to add a customer to the waitlist queue.
    This is called from the customer-facing JoinQueue component.
    """
    if request.method != 'POST':
        logger.warning(f"Method not allowed in api_join_queue: {request.method}")
        return HttpResponseNotAllowed(['POST'])
    
    # Get the restaurant
    try:
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
    except Exception as e:
        logger.error(f"Error retrieving restaurant {restaurant_id}: {str(e)}")
        return JsonResponse({'error': f"Restaurant not found: {str(e)}"}, status=404)
        
    # Parse JSON data from request body
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error in api_join_queue: {str(e)}")
        return JsonResponse({'error': f"Invalid JSON format: {str(e)}"}, status=400)
    
    # Validate required fields
    required_fields = ['customer_name', 'phone_number', 'people_count']
    for field in required_fields:
        if field not in data:
            logger.warning(f"Missing required field in api_join_queue: {field}")
            return JsonResponse({'error': f"Missing required field: {field}"}, status=400)
    
    # Extract and validate data
    customer_name = data.get('customer_name')
    phone_number = data.get('phone_number')
    people_count = data.get('people_count')
    notes = data.get('notes', '')
    
    # Check for existing entry with the same phone number
    existing_entry = QueueEntry.objects.filter(
        restaurant=restaurant,
        phone_number=phone_number,
        status='WAITING'
    ).first()
    
    if existing_entry:
        logger.warning(f"Duplicate entry attempt for phone {phone_number} in restaurant {restaurant_id}")
        return JsonResponse({
            'error': 'Phone number already in queue', 
            'entry_id': existing_entry.id
        }, status=409)  # 409 Conflict
    
    # Create new queue entry
    try:
        entry = QueueEntry.objects.create(
            restaurant=restaurant,
            customer_name=customer_name,
            phone_number=phone_number,
            people_count=people_count,
            notes=notes,
            status='WAITING',
            timestamp=timezone.now()
        )
        
        # Calculate queue position and estimated wait time
        position = QueueEntry.objects.filter(
            restaurant=restaurant,
            status='WAITING',
            timestamp__lt=entry.timestamp
        ).count() + 1
        
        # Estimate wait time (based on people ahead * average wait per party)
        avg_minutes_per_party = restaurant.avg_wait_time or 15  # Default to 15 minutes if not set
        estimated_wait = position * avg_minutes_per_party
        
        # Get all waiting entries to emit update
        queue_entries = QueueEntry.objects.filter(
            restaurant=restaurant, 
            status='WAITING'
        ).order_by('timestamp')
        
        # Return success response with queue details
        logger.info(f"New queue entry created: ID {entry.id}, position {position}, wait time {estimated_wait} min")
        return JsonResponse({
            'success': True,
            'entry_id': entry.id,
            'position': position,
            'estimated_wait': estimated_wait,
            'queue_count': queue_entries.count()
        })
        
    except Exception as e:
        logger.error(f"Error creating queue entry: {str(e)}")
        return JsonResponse({'error': f"Could not create queue entry: {str(e)}"}, status=500)

@csrf_exempt
def api_entry_status(request, entry_id):
    """
    API endpoint to update the status of a queue entry.
    Used by the waitlist manager to mark entries as SERVED or CANCELED.
    """
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    
    # Get the queue entry and verify ownership
    try:
        entry = get_object_or_404(QueueEntry, id=entry_id)
        
        # Security check: Only restaurant owner should be able to update status
        if not request.user.is_authenticated or entry.restaurant.user != request.user:
            logger.warning(f"Unauthorized status update attempt for entry {entry_id}")
            return JsonResponse({'error': 'Unauthorized'}, status=403)
        
        # Parse JSON data to get the new status
        try:
            data = json.loads(request.body)
            new_status = data.get('status')
            
            if not new_status or new_status not in ['SERVED', 'CANCELED', 'WAITING']:
                return JsonResponse({'error': 'Invalid status value'}, status=400)
                
            # Update the status
            entry.status = new_status
            
            # Set completion time if entry is being served or canceled
            if new_status in ['SERVED', 'CANCELED']:
                entry.completion_time = timezone.now()
                
            entry.save()
            
            # Get updated list of queue entries for this restaurant
            queue_entries = QueueEntry.objects.filter(
                restaurant=entry.restaurant, 
                status='WAITING'
            ).order_by('timestamp')
            
            logger.info(f"Queue entry {entry_id} status updated to {new_status}")
            return JsonResponse({'success': True, 'status': new_status})
            
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON in api_entry_status for entry {entry_id}")
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
            
    except Exception as e:
        logger.error(f"Error in api_entry_status: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def api_waitlist_entry(request, entry_id):
    """
    API endpoint to handle modifications to queue entries.
    Supports DELETE for removing entries and PUT for updating entry details.
    """
    # Get the queue entry and verify ownership
    try:
        entry = get_object_or_404(QueueEntry, id=entry_id)
        
        # Security check: Only restaurant owner should be able to modify entries
        if not request.user.is_authenticated or entry.restaurant.user != request.user:
            logger.warning(f"Unauthorized api_waitlist_entry attempt for entry {entry_id}")
            return JsonResponse({'error': 'Unauthorized'}, status=403)
            
        if request.method == 'DELETE':
            # Handle deletion
            restaurant = entry.restaurant
            entry_id = entry.id  # Store for logging
            entry.delete()
            
            # Get updated queue entries
            queue_entries = QueueEntry.objects.filter(
                restaurant=restaurant, 
                status='WAITING'
            ).order_by('timestamp')
            
            logger.info(f"Queue entry {entry_id} deleted")
            return JsonResponse({'success': True, 'message': 'Entry deleted'})
            
        elif request.method == 'PUT':
            # Handle update
            try:
                data = json.loads(request.body)
                
                # Update fields if provided
                if 'customer_name' in data:
                    entry.customer_name = data['customer_name']
                if 'phone_number' in data:
                    entry.phone_number = data['phone_number']
                if 'people_count' in data:
                    entry.people_count = data['people_count']
                if 'notes' in data:
                    entry.notes = data['notes']
                if 'status' in data and data['status'] in ['WAITING', 'SERVED', 'CANCELED']:
                    entry.status = data['status']
                    
                    # Set completion time if status is terminal
                    if data['status'] in ['SERVED', 'CANCELED']:
                        entry.completion_time = timezone.now()
                
                entry.save()
                
                # Get updated queue entries
                queue_entries = QueueEntry.objects.filter(
                    restaurant=entry.restaurant, 
                    status='WAITING'
                ).order_by('timestamp')
                
                logger.info(f"Queue entry {entry_id} updated")
                return JsonResponse({'success': True, 'message': 'Entry updated'})
                
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON in api_waitlist_entry PUT for entry {entry_id}")
                return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        else:
            return HttpResponseNotAllowed(['DELETE', 'PUT'])
            
    except Exception as e:
        logger.error(f"Error in api_waitlist_entry: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

def get_restaurant(request, restaurant_id):
    """
    API endpoint to get restaurant details.
    """
    try:
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        
        data = {
            'id': restaurant.id,
            'name': restaurant.name,
            'logo': restaurant.logo.url if restaurant.logo else None,
            'avg_wait_time': restaurant.avg_wait_time,
            'restaurant_type': restaurant.restaurant_type,
            'address': restaurant.address,
            'city': restaurant.city,
            'state': restaurant.state,
            'zip_code': restaurant.zip_code,
            'phone': restaurant.phone,
            'queue_size': QueueEntry.objects.filter(restaurant=restaurant, status='WAITING').count()
        }
        
        logger.debug(f"Restaurant data fetched for ID {restaurant_id}")
        return JsonResponse(data)
        
    except Exception as e:
        logger.error(f"Error in get_restaurant for ID {restaurant_id}: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

def api_queue_confirmation(request, restaurant_id, queue_entry_id):
    """
    API endpoint to get queue confirmation details.
    """
    try:
        # Retrieve the restaurant
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)

        # Retrieve the queue entry
        queue_entry = get_object_or_404(QueueEntry, id=queue_entry_id, restaurant=restaurant)

        # Calculate the queue position
        current_position = QueueEntry.objects.filter(
            restaurant=restaurant, 
            status='WAITING',
            timestamp__lte=queue_entry.timestamp
        ).count()

        # Generate the estimated wait time
        wait_time = 15 * (current_position - 1)  # Minutes
        estimated_wait_time = timezone.now() + timezone.timedelta(minutes=wait_time)
        
        # Format the queue entry for the API response
        formatted_entry = {
            'id': queue_entry.id,
            'customer_name': queue_entry.customer_name,
            'phone_number': queue_entry.phone_number,
            'people_count': queue_entry.people_count,
            'status': queue_entry.status,
            'notes': queue_entry.notes or '',
            'restaurant': {
                'id': restaurant.id,
                'name': restaurant.name,
                'address': restaurant.address,
                'phone': restaurant.phone,
            }
        }

        data = {
            'queue_entry': formatted_entry,
            'queue_position': current_position,
            'estimated_time': estimated_wait_time.strftime('%I:%M %p'),  # Format as "1:30 PM"
        }
        
        return JsonResponse(data)
    except Exception as e:
        logger.error(f"Error in api_queue_confirmation: {e}")
        return JsonResponse({'error': str(e)}, status=500) 