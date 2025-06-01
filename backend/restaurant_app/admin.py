from django.contrib import admin
# from django.contrib.auth.admin import UserAdmin # No longer needed here
# from .models import Restaurant, CustomUser # Models moved
# from waitlist.models import WaitlistEntry # WaitlistEntry admin should be in waitlist app

# CustomUserAdmin and RestaurantAdmin moved to auth_settings.admin

# WaitlistEntryAdmin should be in waitlist.admin.py. Removing from here if it was added.
# @admin.register(WaitlistEntry)
# class WaitlistEntryAdmin(admin.ModelAdmin):
#     list_display = ('customer_name', 'restaurant', 'phone_number', 'status', 'timestamp', 'people_count', 'notes')
#     list_filter = ('status', 'restaurant', 'timestamp')
#     search_fields = ('customer_name', 'phone_number', 'restaurant__name', 'notes')
#     list_editable = ('status', 'notes')
#     date_hierarchy = 'timestamp'

# This file might become empty if restaurant_app has no other models to register for admin.
# If restaurant_app has other models, their admin registration would remain here.
pass # If empty


