# restaurant_app/management/commands/populate_parties.py
from django.core.management.base import BaseCommand
from django.db.utils import IntegrityError
# from restaurant_app.models import QueueEntry, Party, Restaurant # Old import
from auth_settings.models import Restaurant # New import
from parties.models import Party # Import Party from parties app
from waitlist.models import WaitlistEntry # Import WaitlistEntry
from django.utils import timezone

class Command(BaseCommand):
    help = 'Generate Party data from WaitlistEntry history' # Updated help text

    def handle(self, *args, **options):
        restaurants = Restaurant.objects.all()
        for restaurant in restaurants:
            self.stdout.write(f"Processing restaurant: {restaurant.name}")
            
            # Get unique phone numbers from this restaurant's WaitlistEntry history
            phone_numbers = WaitlistEntry.objects.filter(
                restaurant=restaurant
            ).values_list('phone_number', flat=True).distinct()
            
            for phone in phone_numbers:
                if not phone: continue # Skip empty phone numbers

                # Get all entries for this phone number, ordered by timestamp
                entries = WaitlistEntry.objects.filter(
                    restaurant=restaurant,
                    phone_number=phone
                ).order_by('timestamp')
                
                if not entries.exists():
                    continue
                
                # Use the customer name from the latest entry for this phone number
                latest_entry = entries.last()
                customer_name = latest_entry.customer_name
                notes_from_latest = latest_entry.notes
                
                # Calculate total visits (number of SERVED entries for this phone)
                # Assuming WaitlistEntry has a 'status' field with 'SERVED' as a possibility
                total_visits = entries.filter(status='SERVED').count()
                
                # Get the last visit timestamp (from the latest SERVED entry)
                last_served_entry = entries.filter(status='SERVED').last()
                last_visit_time = last_served_entry.completion_time if last_served_entry and hasattr(last_served_entry, 'completion_time') and last_served_entry.completion_time else (last_served_entry.timestamp if last_served_entry else None)

                try:
                    party, created = Party.objects.update_or_create(
                        restaurant=restaurant,
                        phone=phone,
                        defaults={
                            'name': customer_name,
                            'visits': total_visits,
                            'last_visit': last_visit_time,
                            'notes': notes_from_latest # Or accumulate notes if needed
                        }
                    )
                    if created:
                        self.stdout.write(self.style.SUCCESS(f"Created party for {customer_name} ({phone})"))
                    else:
                        self.stdout.write(f"Updated party for {customer_name} ({phone})")
                except IntegrityError:
                    self.stderr.write(self.style.ERROR(f"Integrity error for phone {phone} at restaurant {restaurant.name}. Skipping."))
        self.stdout.write(self.style.SUCCESS("Party population complete."))
