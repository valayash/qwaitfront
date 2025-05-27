"""
Script to create test users for QWait load testing
Run this with: python create_test_users.py
"""

import os
import django
from django.db import IntegrityError

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Qwait.settings')
django.setup()

# Import models
from restaurant_app.models import CustomUser, Restaurant

def create_test_users():
    """Create test users for load testing"""
    print("Creating test users for load testing...")
    
    # Create staff user
    try:
        staff_user = CustomUser.objects.create_user(
            email='teststaff@example.com',
            password='password123',
            is_staff=True
        )
        print(f"Created staff user: {staff_user.email}")
        
        # Create a restaurant for the staff user
        restaurant, created = Restaurant.objects.get_or_create(
            user=staff_user,
            defaults={
                'name': 'Test Restaurant',
                'address': '123 Test Street',
                'phone': '555-123-4567',
            }
        )
        print(f"{'Created' if created else 'Found'} restaurant: {restaurant.name}")
        
    except IntegrityError:
        print("Staff user already exists")
        staff_user = CustomUser.objects.get(email='teststaff@example.com')
    
    # Create 5 customer users
    for i in range(1, 6):
        try:
            customer = CustomUser.objects.create_user(
                email=f'customer{i}@example.com',
                password='password123',
                first_name=f'Customer',
                last_name=f'{i}'
            )
            print(f"Created customer user: {customer.email}")
        except IntegrityError:
            print(f"Customer {i} already exists")

if __name__ == "__main__":
    create_test_users()
    print("Test users setup complete!") 