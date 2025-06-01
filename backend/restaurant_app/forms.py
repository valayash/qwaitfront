from django import forms
# from .models import Restaurant # Old import
from auth_settings.models import Restaurant # New import
# from waitlist.models import WaitlistEntry # No longer needed as WaitlistEntryForm is removed
import re

# WaitlistEntryForm removed as it is likely unused (DRF is used for waitlist submissions)
# class WaitlistEntryForm(forms.ModelForm):
#     class Meta:
#         model = WaitlistEntry
#         fields = ['customer_name', 'phone_number', 'people_count', 'notes', 'restaurant']
#     
#     def clean_phone_number(self):
#         phone = self.cleaned_data.get('phone_number', '')
#         digits_only = re.sub(r'\D', '', phone)
#         if len(digits_only) < 10:
#             raise forms.ValidationError('Please enter a valid phone number with at least 10 digits')
#         if len(digits_only) > 10:
#             digits_only = digits_only[:10]
#         return digits_only

class RestaurantForm(forms.ModelForm):
    class Meta:
        model = Restaurant
        fields = ['name', 'address', 'phone', 'logo'] # Customize as needed

# If SettingsForm and PartyForm were mentioned in base_views.py (they were in an import), 
# they should be defined here or in their respective app's forms.py.
# For now, assuming they are not critical for this step.

# class SettingsForm(forms.Form): # Example placeholder
#     # Define fields for settings form
#     pass

# class PartyForm(forms.ModelForm): # Example placeholder if Party model exists
#     class Meta:
#         # model = Party # If party model moves to parties app, update import
#         # fields = '__all__'
#         pass 