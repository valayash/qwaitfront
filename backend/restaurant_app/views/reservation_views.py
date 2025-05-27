from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.utils import timezone
from datetime import timedelta, datetime
from ..models import Restaurant, QueueEntry, Reservation, Party
from django.views.decorators.csrf import csrf_protect
import logging
import json
from django.views.decorators.http import require_GET, require_POST
from django.contrib import messages
from django.core.cache import cache

# Set up logging
logger = logging.getLogger(__name__)

@login_required
@require_GET
def get_parties(request):
    """API endpoint to get all restaurant parties."""
    restaurant = get_object_or_404(Restaurant, user=request.user)
    
    # Get parties from QueueEntry model with SERVED status
    parties = QueueEntry.objects.filter(
        restaurant=restaurant,
        status='SERVED'
    ).order_by('-timestamp')[:50]  # Get last 50 served parties
    
    # Format the parties data for the response
    parties_data = [{
        'id': party.id,
        'customer_name': party.customer_name,
        'phone_number': party.phone_number,
        'people_count': party.people_count,
        'notes': party.notes,
        'timestamp': party.timestamp.isoformat() if party.timestamp else None,
        'completion_time': party.completion_time.isoformat() if hasattr(party, 'completion_time') and party.completion_time else None
    } for party in parties]
    
    return JsonResponse({
        'success': True,
        'parties': parties_data,
        'count': len(parties_data)
    })

@login_required
@require_GET
def reservations(request):
    """API endpoint to get all restaurant reservations."""
    restaurant = get_object_or_404(Restaurant, user=request.user)
    
    # Get date filter from query params (default to today)
    date_str = request.GET.get('date')
    try:
        if date_str:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        else:
            date = timezone.now().date()
    except ValueError:
        return JsonResponse({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)
    
    # Get all reservations for the date
    reservations = Reservation.objects.filter(
        restaurant=restaurant,
        date=date
    ).order_by('time')
    
    data = {
        'date': date.isoformat(),
        'reservations': [
            {
                'id': res.id,
                'name': res.name,
                'phone': res.phone,
                'party_size': res.party_size,
                'time': res.time.strftime('%H:%M'),
                'notes': res.notes,
                'checked_in': res.checked_in
            }
            for res in reservations
        ]
    }
    
    return JsonResponse(data)

@login_required
def add_reservation(request):
    restaurant = get_object_or_404(Restaurant, user=request.user)
    
    if request.method == 'POST':
        try:
            # Parse the request data
            if request.headers.get('Content-Type') == 'application/json':
                data = json.loads(request.body)
            else:
                data = request.POST
            
            # Check for request_id to prevent duplicate submissions
            request_id = data.get('request_id')
            if request_id:
                # Check if we've already processed this request
                cache_key = f"reservation_req_{request_id}"
                
                if cache.get(cache_key):
                    logger.warning(f"Duplicate request detected with ID: {request_id}")
                    return JsonResponse({'success': False, 'error': 'This request was already submitted.'})
                
                # Mark this request as processed (keep for 5 minutes)
                cache.set(cache_key, True, 300)
            
            # Parse date
            try:
                date_obj = datetime.strptime(data.get('date'), '%Y-%m-%d').date()
            except ValueError:
                return JsonResponse({'success': False, 'error': 'Invalid date format. Required format: YYYY-MM-DD'})
            
            # Parse time with better error handling - accept both HH:MM and 12-hour formats
            time_str = data.get('time')
            try:
                # Try 24-hour format first (HH:MM)
                if ':' in time_str and not any(x in time_str.upper() for x in ['AM', 'PM']):
                    time_obj = datetime.strptime(time_str, '%H:%M').time()
                else:
                    # Try 12-hour format (H:MM AM/PM)
                    time_obj = datetime.strptime(time_str, '%I:%M %p').time()
            except ValueError:
                return JsonResponse({'success': False, 'error': 'Invalid time format. Use either 24-hour (HH:MM) or 12-hour (H:MM AM/PM) format'})
            
            # Create a unique token based on the reservation details to prevent duplicate submissions
            import hashlib
            reservation_token = hashlib.md5(f"{restaurant.id}_{data.get('name')}_{data.get('phone')}_{date_obj}_{time_obj}".encode()).hexdigest()
            
            # Use Django's cache framework to prevent duplicate submissions
            
            # Try to get this token from cache
            if cache.get(reservation_token):
                logger.warning(f"Duplicate reservation submission detected for {data.get('name')} on {date_obj} at {time_obj}")
                return JsonResponse({'success': False, 'error': 'Your reservation is already being processed. Please wait.'})
            
            # Set the token in cache with a 30-second timeout
            cache.set(reservation_token, True, 30)
            
            # Use transaction to ensure database consistency
            from django.db import transaction
            
            with transaction.atomic():
                # Double-check for existing reservation within the transaction
                existing_reservation = Reservation.objects.select_for_update().filter(
                    restaurant=restaurant,
                    name=data.get('name'),
                    phone=data.get('phone'),
                    date=date_obj,
                    time=time_obj
                ).first()
                
                if existing_reservation:
                    # Release the cache lock
                    cache.delete(reservation_token)
                    return JsonResponse({
                        'success': False, 
                        'error': 'A reservation with these details already exists. Please modify the details or edit the existing reservation.'
                    })
                
                # Create a new reservation
                reservation = Reservation(
                    restaurant=restaurant,
                    name=data.get('name'),
                    phone=data.get('phone'),
                    party_size=data.get('party_size'),
                    date=date_obj,
                    time=time_obj,
                    notes=data.get('notes', '')
                )
                reservation.save()
                
                # Log successful reservation creation
                logger.info(f"Created reservation ID {reservation.id} for {reservation.name} on {date_obj} at {time_obj}")
            
            # Release the cache lock
            cache.delete(reservation_token)
            
            return JsonResponse({'success': True, 'id': reservation.id})
        except Exception as e:
            logger.error(f"Error creating reservation: {str(e)}")
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@login_required
def edit_reservation(request, reservation_id):
    reservation = get_object_or_404(Reservation, id=reservation_id, restaurant__user=request.user)
    
    if request.method == 'POST':
        try:
            # Parse the request data
            if request.headers.get('Content-Type') == 'application/json':
                data = json.loads(request.body)
            else:
                data = request.POST
            
            # Parse date
            try:
                date_obj = datetime.strptime(data.get('date'), '%Y-%m-%d').date()
            except ValueError:
                return JsonResponse({'success': False, 'error': 'Invalid date format. Required format: YYYY-MM-DD'})
            
            # Parse time with better error handling - accept both HH:MM and 12-hour formats
            time_str = data.get('time')
            try:
                # Try 24-hour format first (HH:MM)
                if ':' in time_str and not any(x in time_str.upper() for x in ['AM', 'PM']):
                    time_obj = datetime.strptime(time_str, '%H:%M').time()
                else:
                    # Try 12-hour format (H:MM AM/PM)
                    time_obj = datetime.strptime(time_str, '%I:%M %p').time()
            except ValueError:
                return JsonResponse({'success': False, 'error': 'Invalid time format. Use either 24-hour (HH:MM) or 12-hour (H:MM AM/PM) format'})
            
            # Check for existing reservation with same details (excluding this one)
            existing_reservation = Reservation.objects.filter(
                restaurant=reservation.restaurant,
                name=data.get('name'),
                phone=data.get('phone'),
                date=date_obj,
                time=time_obj
            ).exclude(id=reservation_id).first()
            
            if existing_reservation:
                return JsonResponse({
                    'success': False, 
                    'error': 'Another reservation with these details already exists. Please modify the details.'
                })
            
            # Update the reservation
            reservation.name = data.get('name')
            reservation.phone = data.get('phone')
            reservation.party_size = data.get('party_size')
            reservation.date = date_obj
            reservation.time = time_obj
            reservation.notes = data.get('notes', '')
            reservation.save()
            
            # Log successful update
            logger.info(f"Updated reservation ID {reservation.id} for {reservation.name} on {date_obj} at {time_obj}")
            
            return JsonResponse({'success': True})
        except Exception as e:
            logger.error(f"Error updating reservation: {str(e)}")
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@login_required
def delete_reservation(request, reservation_id):
    reservation = get_object_or_404(Reservation, id=reservation_id, restaurant__user=request.user)
    
    if request.method == 'POST':
        reservation.delete()
        return JsonResponse({'success': True})
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})

@login_required
def check_in_reservation(request, reservation_id):
    reservation = get_object_or_404(Reservation, id=reservation_id, restaurant__user=request.user)
    
    if request.method == 'POST':
        try:
            # Mark reservation as checked in
            reservation.checked_in = True
            reservation.check_in_time = timezone.now()
            reservation.save()
            
            # Create a queue entry for this checked-in reservation
            # Use a timestamp in the FUTURE to ensure it appears at the TOP of the list
            # Since the waitlist is sorted by timestamp ASCENDING (oldest first)
            entry_timestamp = timezone.now() + timedelta(days=30)  # 30 days in future to ensure top position
            
            queue_entry = QueueEntry.objects.create(
                restaurant=reservation.restaurant,
                customer_name=reservation.name,
                phone_number=reservation.phone,
                people_count=reservation.party_size,
                timestamp=entry_timestamp,  # This will place it at the top of the list
                notes=f"Reservation for {reservation.time.strftime('%I:%M %p')}. {reservation.notes}",
                status='WAITING'
            )
            
            # Update the waitlist to reflect the new entry
            queue_entries = QueueEntry.objects.filter(
                restaurant=reservation.restaurant, 
                status='WAITING'
            ).order_by('-timestamp')  # Note: descending order here for API call
            
            # Send a signal instead if real-time updates are needed for check-ins
            # For example, a new signal like `reservation_checked_in` could be defined and sent here.
            # queue_entry_created.send(sender=QueueEntry, instance=queue_entry, restaurant=reservation.restaurant)

            messages.success(request, 'Reservation checked in and party added to waitlist.')
            
            return JsonResponse({
                'success': True, 
                'message': 'Reservation checked in and party added to waitlist'
            })
        except Exception as e:
            logger.error(f"Error checking in reservation: {str(e)}")
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@login_required
def get_reservation(request, reservation_id):
    reservation = get_object_or_404(Reservation, id=reservation_id, restaurant__user=request.user)
    
    # Format date and time for form
    date_str = reservation.date.strftime('%Y-%m-%d')
    time_str = reservation.time.strftime('%H:%M')
    
    data = {
        'name': reservation.name,
        'phone': reservation.phone,
        'party_size': reservation.party_size,
        'date': date_str,
        'time': time_str,
        'notes': reservation.notes
    }
    
    return JsonResponse(data) 