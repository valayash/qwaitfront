from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction
from django.contrib.auth.models import AnonymousUser # For permission checks
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from datetime import datetime, timedelta
import hashlib
import logging
from rest_framework.exceptions import PermissionDenied

from .models import Reservation
from .serializers import ReservationSerializer
from auth_settings.models import Restaurant # New import
from waitlist.models import WaitlistEntry # For check-in functionality
from waitlist.serializers import WaitlistEntrySerializer # For check-in response, if needed
from parties.models import Party # New import from parties app

logger = logging.getLogger(__name__)

# Custom Permission for restaurant ownership or staff (to be defined or imported)
class IsRestaurantOwnerOrStaff(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or staff to edit it.
    Assumes the Restaurant model has a 'user' field linking to the owner.
    And that staff users are marked appropriately (e.g., user.is_staff).
    """
    def has_object_permission(self, request, view, obj):
        # Instance must have an attribute named `restaurant`.
        if isinstance(obj, Reservation):
            return obj.restaurant.user == request.user or request.user.is_staff
        # If it's a direct Restaurant object (though not used this way in current views for object-level)
        if isinstance(obj, Restaurant):
            return obj.user == request.user or request.user.is_staff
        return False

    def has_permission(self, request, view):
        # Allow GET requests for listing (e.g., for a specific restaurant by any authenticated user)
        # or POST for creation if they are authenticated.
        # Specific object permissions will handle editing/deleting.
        if request.method in permissions.SAFE_METHODS: # GET, HEAD, OPTIONS
            return request.user and request.user.is_authenticated
        
        # For POST (create), ensure user is authenticated.
        # The restaurant ID will be in the URL or data, and we can check if the user owns that restaurant.
        if request.method == 'POST':
            restaurant_id = view.kwargs.get('restaurant_id') or request.data.get('restaurant')
            if not restaurant_id:
                 # If creating and restaurant_id is not directly available, 
                 # this permission might be too broad or rely on a different check. 
                 # For now, just ensure authenticated for POST, detailed check in view.
                return request.user and request.user.is_authenticated
            
            try:
                restaurant = Restaurant.objects.get(pk=restaurant_id)
                return restaurant.user == request.user or request.user.is_staff
            except Restaurant.DoesNotExist:
                return False # Restaurant not found, deny permission
        
        return request.user and request.user.is_authenticated


class ReservationListCreateAPIView(APIView):
    """List all reservations for a restaurant or create a new one."""
    permission_classes = [IsRestaurantOwnerOrStaff] # Apply custom permission

    def get(self, request, restaurant_id):
        restaurant = get_object_or_404(Restaurant, pk=restaurant_id)
        # Check if the user has permission to view reservations for this restaurant
        if restaurant.user != request.user and not request.user.is_staff:
            return Response({'error': 'You do not have permission to view these reservations.'}, status=status.HTTP_403_FORBIDDEN)

        date_str = request.query_params.get('date')
        try:
            if date_str:
                filter_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            else:
                filter_date = timezone.now().date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
        
        reservations = Reservation.objects.filter(
            restaurant=restaurant,
            date=filter_date
        ).order_by('time')
        serializer = ReservationSerializer(reservations, many=True)
        return Response({
            'date': filter_date.isoformat(),
            'reservations': serializer.data
        })

    def post(self, request, restaurant_id):
        restaurant = get_object_or_404(Restaurant, pk=restaurant_id)
        # Check if the user has permission to create a reservation for this restaurant
        if restaurant.user != request.user and not request.user.is_staff:
            return Response({'error': 'You do not have permission to create reservations for this restaurant.'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data['restaurant'] = restaurant.id # Ensure restaurant is set from URL

        serializer = ReservationSerializer(data=data)
        if serializer.is_valid():
            # Duplicate check logic (moved from old view, model's unique_together is primary)
            # This cache-based check is for rapid re-submission, not a replacement for DB constraints.
            reservation_token_data = f"{restaurant.id}_{serializer.validated_data.get('name')}_{serializer.validated_data.get('phone')}_{serializer.validated_data.get('date')}_{serializer.validated_data.get('time')}"
            reservation_token = hashlib.md5(reservation_token_data.encode()).hexdigest()

            if cache.get(reservation_token):
                logger.warning(f"Duplicate reservation submission detected (cache token) for {reservation_token_data}")
                return Response({'error': 'Your reservation is already being processed. Please wait.'}, status=status.HTTP_409_CONFLICT)
            cache.set(reservation_token, True, 30) # 30-second timeout

            try:
                with transaction.atomic(): # Ensure atomicity
                    # The serializer's save will respect unique_together if model has it.
                    # If not, an explicit check inside transaction might be needed for race conditions
                    # if the cache check isn't sufficient.
                    serializer.save()
                cache.delete(reservation_token) # Clean up cache on success
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e: # Catch potential IntegrityError from unique_together
                cache.delete(reservation_token) # Clean up cache on error
                logger.error(f"Error creating reservation (possibly duplicate): {str(e)}")
                # Check if it's a unique constraint violation (specific to DB, adapt if needed)
                if 'UNIQUE constraint failed' in str(e) or 'duplicate key value violates unique constraint' in str(e):
                    return Response({'error': 'A reservation with these details already exists.'}, status=status.HTTP_409_CONFLICT)
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        cache.delete(reservation_token) # Clean up cache if validation fails early
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReservationDetailAPIView(APIView):
    """Retrieve, update or delete a reservation instance."""
    permission_classes = [IsRestaurantOwnerOrStaff]

    def get_object(self, pk, user):
        obj = get_object_or_404(Reservation, pk=pk)
        self.check_object_permissions(self.request, obj) # Check permissions using IsRestaurantOwnerOrStaff
        return obj

    def get(self, request, restaurant_id, pk): # restaurant_id from URL might not be strictly needed if pk is globally unique
        reservation = self.get_object(pk, request.user)
        serializer = ReservationSerializer(reservation)
        return Response(serializer.data)

    def put(self, request, restaurant_id, pk):
        reservation = self.get_object(pk, request.user)
        data = request.data.copy()
        data['restaurant'] = reservation.restaurant.id # Ensure restaurant is not changed
        
        serializer = ReservationSerializer(reservation, data=data)
        if serializer.is_valid():
            # Check for existing reservation with same details (excluding this one)
            # Model's unique_together should handle this, but an explicit check can provide a clearer error.
            # This logic is often better in the serializer's validate method.
            existing_reservation = Reservation.objects.filter(
                restaurant=reservation.restaurant,
                name=serializer.validated_data.get('name'),
                phone=serializer.validated_data.get('phone'),
                date=serializer.validated_data.get('date'),
                time=serializer.validated_data.get('time')
            ).exclude(id=pk).first()
            
            if existing_reservation:
                return Response({
                    'error': 'Another reservation with these details already exists. Please modify the details.'
                }, status=status.HTTP_409_CONFLICT)
            
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, restaurant_id, pk):
        reservation = self.get_object(pk, request.user)
        reservation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ReservationCheckInAPIView(APIView):
    """Check in a reservation and add to waitlist."""
    permission_classes = [IsRestaurantOwnerOrStaff]

    def post(self, request, restaurant_id, pk):
        reservation = get_object_or_404(Reservation, pk=pk, restaurant_id=restaurant_id)
        self.check_object_permissions(request, reservation) # Check ownership

        if reservation.checked_in:
            return Response({'error': 'Reservation already checked in.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reservation.checked_in = True
            reservation.check_in_time = timezone.now()
            reservation.save()

            # Add to waitlist (using WaitlistEntry from waitlist app)
            # The logic for timestamp (e.g., placing at top) needs consideration
            # Original code used a timestamp 30 days in the future.
            # For DRF/API view, it might be better to let the waitlist app handle its own ordering
            # or provide a specific flag/field if priority is needed.
            entry_timestamp = timezone.now() # Or adjust as per desired waitlist logic

            waitlist_entry_data = {
                'restaurant': reservation.restaurant.id,
                'customer_name': reservation.name,
                'phone_number': reservation.phone,
                'people_count': reservation.party_size,
                'timestamp': entry_timestamp, 
                'notes': f"Reservation: {reservation.time.strftime('%I:%M %p')}. {reservation.notes or ''}",
                'status': 'WAITING'
            }
            # Directly create WaitlistEntry or call a service/signal in waitlist app
            # For now, direct creation:
            waitlist_entry = WaitlistEntry.objects.create(**waitlist_entry_data)
            
            # WebSocket update for waitlist should be handled by WaitlistEntry signals or save method
            # if such a mechanism is in place (as it was for customer_interface). 
            # Or, explicitly send here if needed, similar to customer_interface.

            return Response({
                'success': True, 
                'message': 'Reservation checked in and party added to waitlist.',
                'waitlist_entry_id': waitlist_entry.id
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error checking in reservation {pk}: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# The get_parties view from reservation_views.py needs to be refactored into its own APIView.
# It seems to list SERVED QueueEntry items, which might belong more to `waitlist` or `parties` app logic.
# For now, I will create it here as PartyListAPIView based on its original location.
# If Party model is separate, this will change.

# Serializer for Party model would be needed if Party is a distinct model.
# For now, using QueueEntry with status SERVED as per original get_parties logic.

class ServedPartyListAPIView(APIView):
    """API endpoint to get recently served parties (from WaitlistEntry)."""
    permission_classes = [IsRestaurantOwnerOrStaff]

    def get(self, request, restaurant_id):
        restaurant = get_object_or_404(Restaurant, pk=restaurant_id)
        # Permission check for the restaurant
        if restaurant.user != request.user and not request.user.is_staff:
            return Response({'error': 'You do not have permission for this restaurant.'}, status=status.HTTP_403_FORBIDDEN)

        # Get parties from WaitlistEntry model with SERVED status
        # Using WaitlistEntry as the source of "served parties" as per original get_parties
        served_entries = WaitlistEntry.objects.filter(
            restaurant=restaurant,
            status='SERVED'
        ).order_by('-completion_time')[:50]  # Assuming completion_time is set when served
        
        # Use WaitlistEntrySerializer for served entries
        serializer = WaitlistEntrySerializer(served_entries, many=True)
        
        return Response({
            'success': True,
            'parties': serializer.data,
            'count': len(serializer.data)
        })
