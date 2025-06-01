from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.conf import settings
import logging
from django.utils import timezone

from .utils import send_email_notification, send_sms_via_twilio
# from restaurant_app.models import Restaurant # Old import
from auth_settings.models import Restaurant # New import
from waitlist.models import WaitlistEntry # To fetch entry details for context
# Import your permission class, e.g., IsRestaurantOwnerOrStaff from reservation.views or a common place
# For now, using a placeholder or simple IsAuthenticated.
# from reservation.views import IsRestaurantOwnerOrStaff # Example: if it was in reservation app

logger = logging.getLogger(__name__)

class IsRestaurantOwnerOrStaff(permissions.BasePermission):
    """
    Placeholder: Custom permission to only allow owners of a restaurant or staff to send notifications.
    This should ideally be defined in a common permissions file and imported.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        restaurant_id = request.data.get('restaurant_id') # Expect restaurant_id in request data
        entry_id = request.data.get('entry_id') # Expect entry_id for context

        if not restaurant_id and entry_id:
            try:
                entry = WaitlistEntry.objects.select_related('restaurant').get(pk=entry_id)
                restaurant_id = entry.restaurant.id
            except WaitlistEntry.DoesNotExist:
                return False # Cannot determine restaurant context
        
        if not restaurant_id:
             # Fallback or deny if no restaurant context can be derived
            return False

        try:
            restaurant = Restaurant.objects.get(pk=restaurant_id)
            # Store restaurant on view for use in post method, or pass explicitly
            view.restaurant = restaurant 
            return restaurant.user == request.user or request.user.is_staff
        except Restaurant.DoesNotExist:
            return False
        return True # Should be unreachable if logic is correct

class SendNotificationAPIView(APIView):
    """
    API endpoint to send notifications (SMS, Email) to a customer associated with a WaitlistEntry.
    Expects 'entry_id', 'notification_type' ('sms', 'email', or 'both'), 
    and optional 'message' (for SMS) or 'subject', 'email_context' (for email) in request body.
    """
    permission_classes = [IsRestaurantOwnerOrStaff] # Protect this endpoint

    def post(self, request, *args, **kwargs):
        entry_id = request.data.get('entry_id')
        notification_type = request.data.get('notification_type', 'sms').lower()
        # Restaurant object should be set on view by permission class or fetched here
        # restaurant = getattr(self, 'restaurant', None) 
        # For now, re-fetch based on entry_id for safety, or ensure permission class sets it.

        if not entry_id:
            return Response({"error": "entry_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            waitlist_entry = WaitlistEntry.objects.select_related('restaurant').get(pk=entry_id)
        except WaitlistEntry.DoesNotExist:
            return Response({"error": "WaitlistEntry not found"}, status=status.HTTP_404_NOT_FOUND)

        # Re-check permission specifically for this entry's restaurant if not covered by general perm check
        # This is a bit redundant if IsRestaurantOwnerOrStaff correctly uses restaurant_id from request.data
        # or derives it, but added for clarity if the permission is simpler.
        current_restaurant = waitlist_entry.restaurant
        if not (current_restaurant.user == request.user or request.user.is_staff):
             return Response({"error": "Permission denied for this restaurant/entry."}, status=status.HTTP_403_FORBIDDEN)

        customer_name = waitlist_entry.customer_name
        customer_phone = waitlist_entry.phone_number
        # customer_email = waitlist_entry.customer_email # Assuming QueueEntry has an email field or relation
        # For demonstration, let's assume a placeholder email or that it needs to be passed in request
        customer_email = request.data.get('customer_email', 'customer@example.com') 

        sms_sent = False
        email_sent = False
        sms_details = {}
        email_details = {}

        if notification_type in ['sms', 'both']:
            sms_message_body = request.data.get('message')
            if not sms_message_body:
                sms_message_body = f"Hello {customer_name}, your table at {current_restaurant.name} is ready! Please proceed to the host stand."
            
            sms_result = send_sms_via_twilio(customer_phone, sms_message_body)
            sms_sent = sms_result.get('success', False)
            sms_details = sms_result
            if sms_sent:
                # Mark entry as notified if your model has such a field
                if hasattr(waitlist_entry, 'notified_sms_at'): # Example field
                    waitlist_entry.notified_sms_at = timezone.now()
                elif hasattr(waitlist_entry, 'notified'):
                    waitlist_entry.notified = True # Generic notified flag
                # waitlist_entry.save() # Save if changes made

        if notification_type in ['email', 'both']:
            email_subject = request.data.get('subject', f"Update from {current_restaurant.name}")
            email_context = request.data.get('email_context', {})
            
            # Ensure essential context for templates
            email_context.update({
                'customer_name': customer_name,
                'restaurant_name': current_restaurant.name,
                'entry_details': waitlist_entry, # Pass the whole entry for more flexibility in template
                # Add more default context if needed by your templates
            })
            
            # Template paths should be defined in settings or constants
            # Using placeholder paths for now
            text_template = request.data.get('text_template', 'notifications/emails/customer_notification.txt')
            html_template = request.data.get('html_template', 'notifications/emails/customer_notification.html')
            
            if customer_email: # Make sure there is an email to send to
                email_sent = send_email_notification(
                    recipient_list=[customer_email],
                    subject=email_subject,
                    text_template_path=text_template,
                    html_template_path=html_template,
                    context=email_context
                )
                email_details = {"success": email_sent, "recipient": customer_email}
                if email_sent and hasattr(waitlist_entry, 'notified_email_at'): # Example field
                    waitlist_entry.notified_email_at = timezone.now()
                    # waitlist_entry.save() # Save if changes made
            else:
                email_details = {"success": False, "error": "customer_email_not_provided"}
        
        # Save waitlist_entry if any notification-related fields were updated
        # For example, if 'notified' or specific timestamp fields were set.
        # Consider what fields on WaitlistEntry should be updated upon notification.
        # Example: if entry.notified has been set to True by SMS part.
        if hasattr(waitlist_entry, 'notified') and (sms_sent and notification_type in ['sms', 'both']):
            waitlist_entry.save(update_fields=['notified'])
        elif (hasattr(waitlist_entry, 'notified_sms_at') and sms_sent) or \
             (hasattr(waitlist_entry, 'notified_email_at') and email_sent):
            update_fields = []
            if hasattr(waitlist_entry, 'notified_sms_at') and sms_sent: update_fields.append('notified_sms_at')
            if hasattr(waitlist_entry, 'notified_email_at') and email_sent: update_fields.append('notified_email_at')
            if update_fields: waitlist_entry.save(update_fields=update_fields)

        if sms_sent or email_sent:
            return Response({
                "success": True, 
                "message": "Notification process attempted.",
                "sms_status": sms_details,
                "email_status": email_details
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "success": False, 
                "message": "Failed to send any notification or notification type not supported.",
                "sms_status": sms_details,
                "email_status": email_details
            }, status=status.HTTP_400_BAD_REQUEST)
