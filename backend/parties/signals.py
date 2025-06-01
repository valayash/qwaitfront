from django.db.models.signals import post_save
from django.dispatch import receiver
import logging

from waitlist.models import WaitlistEntry # Signal sender
from .models import Party # Model being updated
# Restaurant model might be needed if not accessible via instance.restaurant directly
# from restaurant_app.models import Restaurant

logger = logging.getLogger(__name__)

@receiver(post_save, sender=WaitlistEntry)
def update_party_from_waitlist_entry(sender, instance, created, **kwargs):
    """
    Update Party table when a WaitlistEntry is created or updated.
    Listens to WaitlistEntry from the waitlist app.
    Updates Party in the parties app.
    """
    if not instance.phone_number:
        logger.debug(f"Skipping party update for WaitlistEntry {instance.id} due to no phone number.")
        return
        
    try:
        party, party_created = Party.objects.get_or_create(
            restaurant=instance.restaurant, # Assumes instance.restaurant is the Restaurant object
            phone=instance.phone_number,
            defaults={
                'name': instance.customer_name,
                'visits': 0,
                'notes': instance.notes if instance.notes else '', # Ensure notes is not None
                'last_visit': None, 
            }
        )
        
        # Always update name from the latest entry, could be a preference
        party.name = instance.customer_name
        if instance.notes:
            party.notes = instance.notes # Or append/merge notes based on logic
        
        if instance.status == 'SERVED': 
            # Only increment visits if it's a new SERVED entry or if specific logic dictates re-counting
            # This basic implementation increments on any save where status is SERVED.
            # A more robust way might be to check if status changed to SERVED.
            if created or not party.last_visit or (hasattr(instance, 'completion_time') and instance.completion_time > (party.last_visit or instance.timestamp)):
                 party.visits = Party.objects.filter(restaurant=instance.restaurant, phone=instance.phone_number, waitlist_entries__status='SERVED').count() # Recalculate if needed or simply increment
            party.visits += 1 # Simplified: increment visits when saved as SERVED
            party.last_visit = getattr(instance, 'completion_time', instance.timestamp)
        
        party.save()
        if party_created:
            logger.info(f"Created Party {party.id} for {party.name} from WaitlistEntry {instance.id}")
        else:
            logger.info(f"Updated Party {party.id} for {party.name} from WaitlistEntry {instance.id}")
    except Exception as e:
        logger.error(f"Error in update_party_from_waitlist_entry for WaitlistEntry {instance.id}: {str(e)}") 