from django.db.models.signals import post_save
from django.dispatch import receiver
# from django.core.mail import send_mail # Not used by remaining signals
from django.conf import settings # Keep for now, might be used by other logic or future signals
from customer_interface.views import queue_entry_created
# from .models import CustomUser, Restaurant # Old import
# from auth_settings.models import CustomUser, Restaurant # Not needed if these signals don't directly use them
# from parties.models import Party # No longer needed here, its update logic is in parties.signals
from waitlist.models import WaitlistEntry # Used by handle_waitlist_entry_save

import logging

logger = logging.getLogger(__name__)

# The update_party_from_waitlist_entry receiver has been moved to parties/signals.py
# @receiver(post_save, sender=WaitlistEntry)
# def update_party_from_waitlist_entry(sender, instance, created, **kwargs):
#     """
#     Update Party table (now in parties.models) when a WaitlistEntry is created or updated.
#     """
#     # ... logic moved ...
#     pass

# This file is now empty and can be deleted if no other WebSocket routing specific to `restaurant_app` is needed.