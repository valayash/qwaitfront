from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from auth_settings.models import Restaurant # New import
from waitlist.models import WaitlistEntry # Changed from QueueEntry
from waitlist.serializers import WaitlistEntrySerializer # Changed from QueueEntrySerializer
import json
import logging
import re
from django.conf import settings

# Import Django signals
from django.dispatch import Signal

# Define a new signal
queue_entry_created = Signal() # This might need to be re-evaluated if it's still used or moved.

# Set up logging
logger = logging.getLogger(__name__)

# Imports for WebSocket broadcast
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class CustomerHomeAPIView(APIView):
    """API endpoint for customer home page data."""
    def get(self, request):
        return Response({
            'success': True,
            'message': 'Welcome to Qwait API'
        })

class ScanQRAPIView(APIView):
    """
    API endpoint for QR code scanning.
    Returns restaurant info and redirects to join queue.
    """
    def get(self, request, restaurant_id):
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        
        # Consider using settings for FRONTEND_URL
        frontend_url = getattr(settings, 'FRONTEND_URL', '') # Requires from django.conf import settings
        
        return Response({
            'success': True,
            'restaurant': {
                'id': restaurant.id,
                'name': restaurant.name
            },
            # The redirect URL should ideally be handled by the frontend based on the response
            'join_queue_url_segment': f"/join-queue/{restaurant_id}/"
        })

class JoinQueueAPIView(APIView):
    """
    API endpoint for join queue page data.
    Returns restaurant info and current queue size.
    """
    def get(self, request, restaurant_id):
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        
        referrer = request.META.get('HTTP_REFERER', '')
        is_qr_scan = 'qr' in referrer or request.GET.get('qr') == '1'
        
        return Response({
            'success': True,
            'restaurant': {
                'id': restaurant.id,
                'name': restaurant.name,
                'address': restaurant.address,
                'phone': restaurant.phone
            },
            'is_qr_scan': is_qr_scan,
            'queue_size': WaitlistEntry.objects.filter(restaurant=restaurant, status='WAITING').count()
        })

class JoinQueueSubmitAPIView(APIView):
    """
    API endpoint for submitting join queue form.
    Handles validation and queue entry creation.
    """
    def post(self, request, restaurant_id):
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        
        data = request.data # DRF automatically parses JSON
        
        customer_name = data.get('customer_name')
        phone_number = data.get('phone_number')
        people_count = data.get('people_count')
        notes = data.get('notes', '')
        
        if not all([customer_name, phone_number, people_count]):
            return Response({
                'success': False,
                'error': 'Please fill all required fields',
                'validation_errors': {
                    'customer_name': [] if customer_name else ['This field is required'],
                    'phone_number': [] if phone_number else ['This field is required'],
                    'people_count': [] if people_count else ['This field is required']
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        clean_phone = re.sub(r'\D', '', phone_number)
        
        existing_entry = WaitlistEntry.objects.filter(
            restaurant=restaurant,
            phone_number__contains=clean_phone, # Consider exact match or more robust cleaning
            status='WAITING'
        ).first()
        
        if existing_entry:
            return Response({
                'success': False,
                'error': f"This phone number is already in the queue (for {existing_entry.customer_name})",
                'duplicate': True,
                'entry_id': existing_entry.id
            }, status=status.HTTP_409_CONFLICT)
        
        try:
            entry = WaitlistEntry.objects.create(
                restaurant=restaurant,
                customer_name=customer_name,
                phone_number=phone_number,
                people_count=int(people_count),
                notes=notes,
                status='WAITING',
                timestamp=timezone.now()
            )
            
            channel_layer = get_channel_layer()
            group_name = f"waitlist_{restaurant.id}" 
            # Use WaitlistEntrySerializer
            message_data = WaitlistEntrySerializer(entry).data 
            
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'send.waitlist.update', # Match consumer method name
                    'data': message_data
                }
            )
            logger.info(f"Sent Channels update to group {group_name} for new entry {entry.id}")

            queue_entries = WaitlistEntry.objects.filter(
                restaurant=restaurant, 
                status='WAITING'
            ).order_by('timestamp')
            
            position = 0
            for i, e in enumerate(queue_entries):
                if e.id == entry.id:
                    position = i + 1
                    break
            
            avg_wait_time = getattr(restaurant, 'avg_wait_time', 15) 
            estimated_wait = position * avg_wait_time
            
            # queue_entry_created.send(sender=WaitlistEntry, instance=entry, restaurant=restaurant) # Re-evaluate signal usage
            
            # Consider using settings for FRONTEND_URL
            frontend_url = getattr(settings, 'FRONTEND_URL', '') # Requires from django.conf import settings
            
            return Response({
                'success': True,
                'queue_entry_id': entry.id,
                'position': position,
                'estimated_wait_time': estimated_wait,
                # The redirect URL should ideally be handled by the frontend
                'confirmation_url_segment': f"/join-queue/{restaurant_id}/queue-confirmation/{entry.id}/"
            }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            logger.error(f"Error in join_queue_submit: {str(e)}")
            return Response({
                'success': False,
                'error': 'Error adding to queue. Please try again.',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class QueueConfirmationAPIView(APIView):
    """
    API endpoint for queue confirmation page data.
    Returns entry details, position in line, and estimated wait time.
    """
    def get(self, request, restaurant_id, queue_entry_id):
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        entry = get_object_or_404(WaitlistEntry, id=queue_entry_id, restaurant=restaurant)
        
        if entry.status != 'WAITING':
            return Response({
                'success': True,
                'restaurant': {
                    'id': restaurant.id,
                    'name': restaurant.name
                },
                'queue_entry': WaitlistEntrySerializer(entry).data, # Use serializer
                'position': 0,
                'estimated_wait_time': 0,
                'active': False
            })
        
        queue_entries = WaitlistEntry.objects.filter(
            restaurant=restaurant, 
            status='WAITING'
        ).order_by('timestamp')
        
        position = 0
        for i, e in enumerate(queue_entries):
            if e.id == entry.id:
                position = i + 1
                break
        
        avg_wait_time = getattr(restaurant, 'avg_wait_time', 15)
        estimated_wait = position * avg_wait_time
        
        return Response({
            'success': True,
            'restaurant': {
                'id': restaurant.id,
                'name': restaurant.name,
                'address': restaurant.address,
                'phone': restaurant.phone
            },
            'queue_entry': WaitlistEntrySerializer(entry).data, # Use serializer
            'position': position,
            'estimated_wait_time': estimated_wait,
            'queue_size': queue_entries.count()
        })

class QueueStatusAPIView(APIView):
    """
    API endpoint for checking queue status.
    Returns real-time position in line and estimated wait time.
    """
    def get(self, request, restaurant_id, entry_id): # Parameter renamed to entry_id for consistency
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        
        try:
            entry = get_object_or_404(WaitlistEntry, id=entry_id, restaurant=restaurant)
        except WaitlistEntry.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Queue entry not found',
                'restaurant': {
                    'id': restaurant.id,
                    'name': restaurant.name
                }
            }, status=status.HTTP_404_NOT_FOUND)
        
        if entry.status != 'WAITING':
            return Response({
                'success': True,
                'restaurant': {
                    'id': restaurant.id,
                    'name': restaurant.name
                },
                'entry': WaitlistEntrySerializer(entry).data, # Use serializer
                'position': 0,
                'wait_time': 0,
                'active': False
            })
        
        queue_entries = WaitlistEntry.objects.filter(
            restaurant=restaurant, 
            status='WAITING'
        ).order_by('timestamp')
        
        position = 0
        for i, e in enumerate(queue_entries):
            if e.id == entry.id:
                position = i + 1
                break
        
        avg_wait_time = getattr(restaurant, 'avg_wait_time', 15)
        estimated_wait = position * avg_wait_time
        
        time_in_queue = timezone.now() - entry.timestamp
        minutes_in_queue = int(time_in_queue.total_seconds() / 60)
        
        return Response({
            'success': True,
            'restaurant': {
                'id': restaurant.id,
                'name': restaurant.name
            },
            'entry': WaitlistEntrySerializer(entry).data, # Use serializer
            'position': position,
            'wait_time': estimated_wait,
            'queue_size': queue_entries.count(),
            'minutes_in_queue': minutes_in_queue,
            'active': True
        })

class LeaveQueueAPIView(APIView):
    """
    API endpoint for leaving the queue.
    Marks entry as canceled and updates the queue.
    """
    def post(self, request, restaurant_id, entry_id): # Parameter renamed to entry_id
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        entry = get_object_or_404(WaitlistEntry, id=entry_id, restaurant=restaurant)
        
        if entry.status != 'WAITING':
            return Response({'success': False, 'error': 'Entry is not active'}, status=status.HTTP_400_BAD_REQUEST)
        
        entry.status = 'CANCELED'
        entry.completion_time = timezone.now()
        entry.save()
        
        # --- Send WebSocket Update for removal/cancellation ---
        channel_layer = get_channel_layer()
        group_name = f"waitlist_{restaurant.id}"
        
        # Option 1: Send full updated list (if consumer expects it)
        # updated_waitlist_entries = WaitlistEntry.objects.filter(restaurant=restaurant, status='WAITING').order_by('timestamp')
        # serialized_entries = WaitlistEntrySerializer(updated_waitlist_entries, many=True).data
        # async_to_sync(channel_layer.group_send)(
        #     group_name,
        #     {
        #         'type': 'send.waitlist.update', # Or a specific type for full list update
        #         'data': serialized_entries
        #     }
        # )

        # Option 2: Send a specific removal message (preferred if consumer handles it)
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'send.waitlist.remove', # Consumer needs to handle this type
                'data': {'id': entry.id} # Send ID of removed entry
            }
        )
        logger.info(f"Sent Channels update to group {group_name} for removed entry {entry.id}")
        # --- End WebSocket Update ---
        
        # Consider using settings for FRONTEND_URL
        # frontend_url = getattr(settings, 'FRONTEND_URL', '') # Requires from django.conf import settings

        return Response({
            'success': True,
            'message': 'You have successfully left the queue',
            # The redirect URL should ideally be handled by the frontend
            'redirect_url_segment': f"/restaurant/{restaurant_id}/queue-left"
        })

class QueueLeftAPIView(APIView):
    """API endpoint for queue left confirmation."""
    def get(self, request, restaurant_id):
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        return Response({
            'success': True,
            'message': 'You have successfully left the queue',
            'restaurant': {
                'id': restaurant.id,
                'name': restaurant.name
            }
        })

class CheckPhoneAPIView(APIView):
    """
    API endpoint to check if a phone number exists in the waitlist for a specific restaurant.
    """
    def get(self, request, restaurant_id, phone_number):
        logger.debug(f"Checking phone number {phone_number} for restaurant ID {restaurant_id}")
        
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        
        # Clean the phone number for a more robust check if necessary, e.g., removing non-digits
        # clean_phone_number = re.sub(r'\D', '', phone_number)
        
        entry = WaitlistEntry.objects.filter(
            restaurant=restaurant,
            phone_number__iexact=phone_number, # Case-insensitive exact match, or use __contains if partial match is desired
            status='WAITING'
        ).first()
        
        response_data = {'exists': entry is not None}
        if entry:
            response_data['entry_id'] = entry.id
            response_data['customer_name'] = entry.customer_name
            logger.debug(f"Found existing entry with ID {entry.id} for phone {phone_number}")
        else:
            logger.debug(f"No existing entry found for phone {phone_number}")
        
        return Response(response_data)

# Need to add `from django.conf import settings` at the top if FRONTEND_URL is used from settings.
# The signal `queue_entry_created` and its usage should be reviewed. If it's part of a notification system
# or other logic, ensure it's correctly placed or adapted.
# The WebSocket message for `LeaveQueueAPIView` has been changed to `send.waitlist.remove`
# and sends only the ID of the removed entry. The consumer (`WaitlistConsumer`)
# will need a corresponding method `send_waitlist_remove(self, event)` to handle this.
