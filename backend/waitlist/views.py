from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.utils import timezone
from django.core.exceptions import PermissionDenied
import logging
import json
from django.conf import settings
import qrcode
from io import BytesIO
import base64

from rest_framework import viewsets, status, generics # Added generics for APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView # For standalone API views
from rest_framework.permissions import IsAuthenticated # Standard permission

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from auth_settings.models import Restaurant # New import
from .models import WaitlistEntry
from .serializers import WaitlistEntrySerializer
from .permissions import IsRestaurantOwner # Import custom permission

logger = logging.getLogger(__name__)

# --- MOVED FUNCTIONS ---
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

def generate_qr_code(data, size=10):
    """
    Generates a QR code image for the provided data URL.
    Returns base64 encoded image data.
    """
    # logger is already defined at module level
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
# --- END MOVED FUNCTIONS ---

# --- Helper for WebSocket updates (Revised) ---
def broadcast_waitlist_update(restaurant_id, entry_instance=None, event_type='send.waitlist.update', removed_id=None, full_update=False):
    channel_layer = get_channel_layer()
    group_name = f"waitlist_{restaurant_id}" # Ensure this group name is used by your consumer
    message = {
        'type': event_type, # e.g., 'send.waitlist.update', 'send.waitlist.remove'
    }
    if event_type == 'send.waitlist.remove':
        message['data'] = {'id': removed_id, 'status': 'REMOVED'}
    elif entry_instance:
        message['data'] = WaitlistEntrySerializer(entry_instance).data
    elif full_update:
         message['data'] = {'message': 'Full waitlist refresh requested'} # Signal frontend to refetch all data
    else:
        # Can be used for generic updates if needed, or this branch can be removed
        message['data'] = {'message': 'Waitlist updated'}

    async_to_sync(channel_layer.group_send)(group_name, message)
    entry_id_log = removed_id or (entry_instance.id if entry_instance else 'general')
    logger.info(f"Sent {event_type} to group {group_name} for entry/event: {entry_id_log}")

# --- WaitlistEntryViewSet (DRF ModelViewSet - Enhanced) ---
class WaitlistEntryViewSet(viewsets.ModelViewSet):
    serializer_class = WaitlistEntrySerializer
    permission_classes = [IsAuthenticated, IsRestaurantOwner]

    def get_queryset(self):
        # Already correctly filters by the user's restaurant from previous setup
        # Ensure request.user.restaurant is available and correct
        # MODIFIED: Query Restaurant model to get the user's restaurant
        try:
            restaurant = Restaurant.objects.get(user=self.request.user)
            return WaitlistEntry.objects.filter(restaurant=restaurant).order_by('timestamp')
        except Restaurant.DoesNotExist:
            # Handle case where user is authenticated but not linked to a restaurant
            # Or if IsRestaurantOwner permission should have caught this.
            logger.warning(f"User {self.request.user.id} does not have an associated restaurant.")
            return WaitlistEntry.objects.none() # Return an empty queryset

    def list(self, request, *args, **kwargs):
        """ Custom list view to return formatted entries, similar to refresh_waitlist_view."""
        restaurant = get_object_or_404(Restaurant, user=request.user)
        formatted_entries, count, _ = get_formatted_waitlist_entries(restaurant)
        return Response({
            'count': count,
            'entries': formatted_entries
        })

    def perform_create(self, serializer):
        # `restaurant` is automatically set to `request.user.restaurant` due to `get_queryset` and serializer scope
        # or by explicitly passing it if needed by serializer.
        # Here, we ensure it's linked to the authenticated user's restaurant.
        instance = serializer.save(restaurant=self.request.user.restaurant)
        broadcast_waitlist_update(self.request.user.restaurant.id, instance, event_type='send.waitlist.update')

    def perform_update(self, serializer):
        instance = serializer.save()
        broadcast_waitlist_update(instance.restaurant.id, instance, event_type='send.waitlist.update')

    def perform_destroy(self, instance):
        restaurant_id = instance.restaurant.id
        entry_id = instance.id
        instance.delete()
        broadcast_waitlist_update(restaurant_id, event_type='send.waitlist.remove', removed_id=entry_id)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsRestaurantOwner])
    def set_status(self, request, pk=None):
        entry = self.get_object()
        new_status = request.data.get('status')
        if new_status not in [choice[0] for choice in WaitlistEntry.STATUS_CHOICES]:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        entry.status = new_status
        # if new_status in ['SERVED', 'REMOVED'] and hasattr(entry, 'completion_time'):
        #     entry.completion_time = timezone.now()
        entry.save()
        broadcast_waitlist_update(entry.restaurant.id, entry, event_type='send.waitlist.update')
        return Response(WaitlistEntrySerializer(entry).data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsRestaurantOwner])
    def data_with_qr(self, request):
        """ Consolidates api_waitlist_data_view: returns formatted entries and QR code."""
        restaurant = get_object_or_404(Restaurant, user=request.user)
        formatted_entries, count, _ = get_formatted_waitlist_entries(restaurant)
        
        join_url = f"{settings.FRONTEND_URL}/join-queue/{restaurant.id}"
        qr_base64_data_uri = generate_qr_code(join_url)
        
        return Response({
            'restaurant': {
                'id': restaurant.id,
                'name': restaurant.name,
                'waitlist_columns': restaurant.waitlist_columns if hasattr(restaurant, 'waitlist_columns') else ['notes', 'arrival_time', 'status'],
            },
            'queue_entries': formatted_entries,
            'queue_count': count,
            'qr_code': qr_base64_data_uri,
            'join_url': join_url,
        })

# --- Standalone APIViews for Restaurant-level Waitlist Operations ---

class WaitlistRestaurantConfigAPIView(APIView):
    """ API for managing restaurant-specific waitlist configurations, like display columns. """
    permission_classes = [IsAuthenticated, IsRestaurantOwner]

    def get_object(self, request):
        # This view operates on the user's restaurant, not a specific DB object via pk
        return get_object_or_404(Restaurant, user=request.user)

    def get(self, request, *args, **kwargs):
        restaurant = self.get_object(request)
        if hasattr(restaurant, 'waitlist_columns'):
            return Response({'waitlist_columns': restaurant.waitlist_columns}, status=status.HTTP_200_OK)
        return Response({'waitlist_columns': []}, status=status.HTTP_200_OK) # Default if not set

    def post(self, request, *args, **kwargs):
        """ Handles updating waitlist columns. Replaces update_columns_view. """
        restaurant = self.get_object(request)
        if not hasattr(restaurant, 'waitlist_columns'):
            return Response({'error': 'Restaurant model does not support waitlist_columns.'}, status=status.HTTP_400_BAD_REQUEST)

        selected_columns = request.data.get('columns', [])
        if not isinstance(selected_columns, list):
            return Response({'error': 'Columns must be a list.'}, status=status.HTTP_400_BAD_REQUEST)
        
        restaurant.waitlist_columns = selected_columns
        restaurant.save()
        # Optionally, broadcast a general config update if clients need to know
        # broadcast_waitlist_update(restaurant.id, event_type='send.config.update', full_update=True) # Example for config
        return Response({'success': True, 'message': 'Waitlist columns updated.', 'columns': selected_columns}, status=status.HTTP_200_OK)

class WaitlistRestaurantQRCodeAPIView(APIView):
    """ API for fetching the QR code for joining the waitlist. Replaces api_qrcode_view. """
    permission_classes = [IsAuthenticated, IsRestaurantOwner]

    def get(self, request, *args, **kwargs):
        restaurant = get_object_or_404(Restaurant, user=request.user)
        join_url = f"{settings.FRONTEND_URL}/join-queue/{restaurant.id}"
        qr_base64_data_uri = generate_qr_code(join_url)
        return Response({
            'qr_code': qr_base64_data_uri,
            'join_url': join_url,
        }, status=status.HTTP_200_OK)


# --- Retained Function-Based Views (if any are still needed and don't fit ViewSet/APIView model well) ---
# Most of the previous FBVs like add_party_view, remove_entry_view, mark_as_served_view,
# edit_party_view, get_entry_view are now covered by WaitlistEntryViewSet actions (standard CRUD + set_status).

# refresh_waitlist_view is covered by WaitlistEntryViewSet's list action.
# api_waitlist_data_view is covered by WaitlistEntryViewSet's data_with_qr action.
# update_columns_view is replaced by WaitlistRestaurantConfigAPIView.
# api_qrcode_view is replaced by WaitlistRestaurantQRCodeAPIView.

# Consider if any specific nuances of the old FBV responses (e.g. custom messages)
# need to be preserved in the ViewSet responses or if standard DRF responses are acceptable.
# For example, add_party_view had a very specific JSON response.
# The ViewSet's create action will return the serialized object by default.
# If the exact old response for `add_party` is critical, that FBV could be kept or 
# the ViewSet `create` method customized further.

# For now, assuming ViewSet defaults and custom actions are sufficient.
# If a specific FBV is still needed, it can be re-added here, ensuring it uses IsRestaurantOwner or similar permissions.
# Example: if add_party_view had unique logic not fitting the ViewSet's `create`.
# from django.views.decorators.csrf import csrf_protect
# from django.contrib.auth.decorators import login_required

# @login_required
# @csrf_protect
# @require_POST (if it was a POST only view)
# def specific_add_party_view(request):
#     # ... logic from old add_party_view if ViewSet create is not enough ...
#     # Ensure IsRestaurantOwner equivalent check
#     if not (request.user and request.user.is_authenticated and hasattr(request.user, 'restaurant')):
#         return JsonResponse({'error': 'Permission denied'}, status=403)
#     restaurant = request.user.restaurant
#     # ... rest of the logic ...
