# restaurant_app/management/commands/populate_parties.py
from django.core.management.base import BaseCommand
from django.db.models import Count, Max
from restaurant_app.models import QueueEntry, Party, Restaurant

class Command(BaseCommand):
    help = 'Generate Party data from QueueEntry history'

    def handle(self, *args, **options):
        restaurants = Restaurant.objects.all()
        total_created = 0
        
        for restaurant in restaurants:
            self.stdout.write(f"Processing restaurant: {restaurant.name}")
            
            # Get unique phone numbers from this restaurant's QueueEntry history
            phone_numbers = QueueEntry.objects.filter(
                restaurant=restaurant
            ).exclude(
                phone_number=''
            ).exclude(
                phone_number__isnull=True
            ).values_list('phone_number', flat=True).distinct()
            
            for phone in phone_numbers:
                # Get all entries for this phone number
                entries = QueueEntry.objects.filter(
                    restaurant=restaurant, 
                    phone_number=phone
                ).order_by('-timestamp')
                
                if not entries:
                    continue
                
                # Get the most recent entry for the name and notes
                latest_entry = entries.first()
                
                # Count how many times this customer has been served
                visit_count = entries.filter(status='SERVED').count()
                
                # Get the most recent visit (when they were served)
                last_visit = entries.filter(status='SERVED').order_by('-timestamp').first()
                
                # Create or update the party record
                party, created = Party.objects.update_or_create(
                    restaurant=restaurant,
                    phone=phone,
                    defaults={
                        'name': latest_entry.customer_name,
                        'visits': visit_count,
                        'last_visit': last_visit.timestamp if last_visit else None,
                        'notes': latest_entry.notes
                    }
                )
                
                if created:
                    total_created += 1
            
        self.stdout.write(self.style.SUCCESS(f'Created {total_created} party records'))
