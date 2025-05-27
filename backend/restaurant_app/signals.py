from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import QueueEntry, Party

# Import the custom signal
from .views.customer_views import queue_entry_created
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=QueueEntry)
def update_party_from_queue_entry(sender, instance, created, **kwargs):
    """
    Update Party table when a QueueEntry is created or updated
    """
    # Skip if the phone number is empty
    if not instance.phone_number:
        return
        
    # Try to find an existing party with this phone number
    party, party_created = Party.objects.get_or_create(
        restaurant=instance.restaurant,
        phone=instance.phone_number,
        defaults={
            'name': instance.customer_name,
            'visits': 0,
            'notes': instance.notes,
            'last_visit': None,
        }
    )
    
    # Update party details with latest info
    party.name = instance.customer_name  # Always use the most recent name
    
    # Update notes if provided
    if instance.notes:
        party.notes = instance.notes
    
    # If the QueueEntry is served, update visit count and last visit
    if instance.status == 'SERVED':
        party.visits += 1
        party.last_visit = instance.timestamp
    
    party.save()

