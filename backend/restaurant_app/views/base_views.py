from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.utils import timezone
from datetime import timedelta
import json
from ..models import Restaurant, QueueEntry, Reservation, Party
from django.conf import settings
import logging
from ..utils import generate_qr_code

# Set up logging
logger = logging.getLogger(__name__)

#
# DASHBOARD PAGE
#
@login_required
@require_GET
def dashboard(request):
    """API endpoint to get dashboard data."""
    restaurant = get_object_or_404(Restaurant, user=request.user)
    
    # Get waiting queue entries
    queue_entries = QueueEntry.objects.filter(
        restaurant=restaurant, 
        status='WAITING'
    ).order_by('timestamp')
    
    # Get today's reservations
    today = timezone.now().date()
    todays_reservations = Reservation.objects.filter(
        restaurant=restaurant,
        date=today
    ).order_by('time')
    
    # Create URL for React frontend join queue page
    join_url = f"{settings.FRONTEND_URL}/join-queue/{restaurant.id}"
    qr_base64 = generate_qr_code(join_url)
    
    # Get stats for today
    today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    served_today = QueueEntry.objects.filter(
        restaurant=restaurant,
        status='SERVED',
        timestamp__gte=today_start
    ).count()
    
    canceled_today = QueueEntry.objects.filter(
        restaurant=restaurant,
        status='CANCELED',
        timestamp__gte=today_start
    ).count()
    
    data = {
        'restaurant': {
            'id': restaurant.id,
            'name': restaurant.name,
            'logo': restaurant.logo.url if restaurant.logo else None,
            'join_url': join_url,
            'qr_code': qr_base64
        },
        'queue_entries': [
            {
                'id': entry.id,
                'customer_name': entry.customer_name,
                'phone_number': entry.phone_number,
                'people_count': entry.people_count,
                'timestamp': entry.timestamp.isoformat(),
                'status': entry.status
            }
            for entry in queue_entries
        ],
        'reservations': [
            {
                'id': res.id,
                'name': res.name,
                'party_size': res.party_size,
                'time': res.time.strftime('%H:%M'),
                'checked_in': res.checked_in
            }
            for res in todays_reservations
        ],
        'stats': {
            'waiting_count': queue_entries.count(),
            'served_today': served_today,
            'canceled_today': canceled_today,
            'reservations_today': todays_reservations.count()
        }
    }
    
    return JsonResponse(data)

#
# WAITLIST PAGE
#
@login_required
@require_GET
def waitlist_view(request):
    """API endpoint to get waitlist data."""
    restaurant = get_object_or_404(Restaurant, user=request.user)
    default_columns = ['notes', 'arrival_time', 'quoted_time']
    
    if not restaurant.waitlist_columns:
        restaurant.waitlist_columns = default_columns
        restaurant.save()
    
    # First, identify entries from reservations
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
    
    # Create URL for React frontend join queue page
    join_url = f"{settings.FRONTEND_URL}/join-queue/{restaurant.id}"
    qr_base64 = generate_qr_code(join_url)
    
    data = {
        'restaurant': {
            'id': restaurant.id,
            'name': restaurant.name,
            'waitlist_columns': restaurant.waitlist_columns or ['notes', 'arrival_time', 'quoted_time']
        },
        'queue_entries': [
            {
                'id': entry.id,
                'customer_name': entry.customer_name,
                'phone_number': entry.phone_number,
                'people_count': entry.people_count,
                'timestamp': entry.timestamp.isoformat(),
                'quoted_time': entry.quoted_time,
                'notes': entry.notes,
                'status': entry.status
            }
            for entry in queue_entries
        ],
        'queue_count': len(queue_entries),
        'qr_code': qr_base64,
        'join_url': join_url
    }
    
    return JsonResponse(data)

#
# RECENT ACTIVITY PAGE
#
@login_required
@require_GET
def recent_activity(request):
    """API endpoint to get recent waitlist activity."""
    restaurant = get_object_or_404(Restaurant, user=request.user)
    recent_time_threshold = timezone.now() - timedelta(days=7)

    # Filter for served and removed entries
    recent_entries = QueueEntry.objects.filter(
        restaurant=restaurant,
        timestamp__gte=recent_time_threshold,
        status__in=['SERVED', 'CANCELED']
    ).order_by('-timestamp')[:50]
    
    # Format the entries for the response
    entries_data = [{
        'id': entry.id,
        'customer_name': entry.customer_name,
        'phone_number': entry.phone_number,
        'people_count': entry.people_count,
        'timestamp': entry.timestamp.isoformat() if entry.timestamp else None,
        'completion_time': entry.completion_time.isoformat() if hasattr(entry, 'completion_time') and entry.completion_time else None,
        'status': entry.status,
        'wait_time_minutes': (entry.completion_time - entry.timestamp).total_seconds() // 60 if hasattr(entry, 'completion_time') and entry.completion_time and entry.timestamp else None
    } for entry in recent_entries]
    
    # Add summary stats
    served_count = sum(1 for entry in recent_entries if entry.status == 'SERVED')
    canceled_count = sum(1 for entry in recent_entries if entry.status == 'CANCELED')
    
    return JsonResponse({
        'success': True,
        'entries': entries_data,
        'stats': {
            'served_count': served_count,
            'canceled_count': canceled_count,
            'total_count': len(entries_data)
        }
    })

#
# SETTINGS PAGE
#
@login_required
@require_GET
def settings_view(request):
    """API endpoint to get restaurant settings."""
    restaurant = get_object_or_404(Restaurant, user=request.user)
    
    settings_data = {
        'restaurant': {
            'id': restaurant.id,
            'name': restaurant.name,
            'logo': restaurant.logo.url if restaurant.logo else None,
            'address': restaurant.address,
            'city': restaurant.city,
            'state': restaurant.state,
            'zip_code': restaurant.zip_code,
            'phone': restaurant.phone,
            'email': restaurant.email if hasattr(restaurant, 'email') else None,
            'website': restaurant.website if hasattr(restaurant, 'website') else None,
            'restaurant_type': restaurant.restaurant_type,
            'avg_wait_time': restaurant.avg_wait_time,
            'waitlist_columns': restaurant.waitlist_columns
        },
        'user': {
            'id': request.user.id,
            'email': request.user.email,
            'username': request.user.username
        }
    }
    
    return JsonResponse(settings_data)

@login_required
@require_POST
def update_settings(request):
    """API endpoint to update restaurant settings."""
    restaurant = get_object_or_404(Restaurant, user=request.user)
    
    try:
        data = json.loads(request.body)
        
        # Update restaurant fields
        restaurant_data = data.get('restaurant', {})
        if 'name' in restaurant_data:
            restaurant.name = restaurant_data['name']
        if 'address' in restaurant_data:
            restaurant.address = restaurant_data['address']
        if 'city' in restaurant_data:
            restaurant.city = restaurant_data['city']
        if 'state' in restaurant_data:
            restaurant.state = restaurant_data['state']
        if 'zip_code' in restaurant_data:
            restaurant.zip_code = restaurant_data['zip_code']
        if 'phone' in restaurant_data:
            restaurant.phone = restaurant_data['phone']
        if 'email' in restaurant_data and hasattr(restaurant, 'email'):
            restaurant.email = restaurant_data['email']
        if 'website' in restaurant_data and hasattr(restaurant, 'website'):
            restaurant.website = restaurant_data['website']
        if 'restaurant_type' in restaurant_data:
            restaurant.restaurant_type = restaurant_data['restaurant_type']
        if 'avg_wait_time' in restaurant_data:
            restaurant.avg_wait_time = restaurant_data['avg_wait_time']
        if 'waitlist_columns' in restaurant_data:
            restaurant.waitlist_columns = restaurant_data['waitlist_columns']
            
        restaurant.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Settings updated successfully'
        })
    except Exception as e:
        logger.error(f"Error updating settings: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)

#
# PARTIES PAGE
#
@login_required
@require_GET
def parties(request):
    """API endpoint to get all parties for the restaurant."""
    restaurant = get_object_or_404(Restaurant, user=request.user)
    
    # Get parties from the Party model
    all_parties = Party.objects.filter(restaurant=restaurant).order_by('-created_at')[:100]  # Get last 100 parties
    
    # Format the parties data for the response
    parties_data = [{
        'id': party.id,
        'name': party.name,
        'phone': party.phone,
        'visits': party.visits,
        'last_visit': party.last_visit.isoformat() if party.last_visit else None,
        'created_at': party.created_at.isoformat() if party.created_at else None,
        'notes': party.notes
    } for party in all_parties]
    
    return JsonResponse({
        'success': True,
        'restaurant': {
            'name': restaurant.name
        },
        'parties': parties_data,
        'count': len(parties_data)
    })

#
# ANALYTICS PAGE
#
@login_required
@require_GET
def analytics(request):
    """API endpoint to get analytics data."""
    restaurant = get_object_or_404(Restaurant, user=request.user)
    
    # Get date range parameters (default to last 30 days)
    days = int(request.GET.get('days', 30))
    end_date = timezone.now()
    start_date = end_date - timedelta(days=days)
    
    # Get all entries in the date range
    entries = QueueEntry.objects.filter(
        restaurant=restaurant,
        timestamp__gte=start_date,
        timestamp__lte=end_date
    )
    
    # Calculate daily stats
    daily_stats = {}
    for entry in entries:
        day = entry.timestamp.date().isoformat()
        if day not in daily_stats:
            daily_stats[day] = {
                'total': 0,
                'served': 0,
                'canceled': 0,
                'wait_time_total': 0,
                'wait_time_count': 0
            }
        
        daily_stats[day]['total'] += 1
        
        if entry.status == 'SERVED':
            daily_stats[day]['served'] += 1
            if hasattr(entry, 'completion_time') and entry.completion_time:
                wait_time = (entry.completion_time - entry.timestamp).total_seconds() // 60
                daily_stats[day]['wait_time_total'] += wait_time
                daily_stats[day]['wait_time_count'] += 1
        
        elif entry.status == 'CANCELED':
            daily_stats[day]['canceled'] += 1
    
    # Calculate average wait times
    for day in daily_stats:
        if daily_stats[day]['wait_time_count'] > 0:
            daily_stats[day]['avg_wait_time'] = daily_stats[day]['wait_time_total'] / daily_stats[day]['wait_time_count']
        else:
            daily_stats[day]['avg_wait_time'] = 0
    
    # Get peak hours
    hour_counts = {}
    for entry in entries:
        hour = entry.timestamp.hour
        if hour not in hour_counts:
            hour_counts[hour] = 0
        hour_counts[hour] += 1
    
    # Convert to list for easier consumption by frontend
    hours_data = [{'hour': hour, 'count': count} for hour, count in hour_counts.items()]
    daily_data = [{'date': date, 'stats': stats} for date, stats in daily_stats.items()]
    
    # Calculate summary stats
    total_entries = entries.count()
    served_entries = entries.filter(status='SERVED').count()
    canceled_entries = entries.filter(status='CANCELED').count()
    avg_party_size = sum(entry.people_count for entry in entries) / total_entries if total_entries > 0 else 0
    
    return JsonResponse({
        'success': True,
        'summary': {
            'total_entries': total_entries,
            'served_entries': served_entries,
            'canceled_entries': canceled_entries,
            'avg_party_size': avg_party_size
        },
        'daily_data': daily_data,
        'hours_data': hours_data
    }) 