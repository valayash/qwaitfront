from django import forms
from .models import QueueEntry, Restaurant
import re

class QueueEntryForm(forms.ModelForm):
    class Meta:
        model = QueueEntry
        fields = ['customer_name', 'phone_number', 'people_count', 'quoted_time', 'notes']
    
    def clean_phone_number(self):
        phone = self.cleaned_data.get('phone_number', '')
        
        # Remove all non-digit characters
        digits_only = re.sub(r'\D', '', phone)
        
        # Check if we have at least 10 digits
        if len(digits_only) < 10:
            raise forms.ValidationError('Please enter a valid phone number with at least 10 digits')
        
        # Limit to 10 digits for standard format
        if len(digits_only) > 10:
            digits_only = digits_only[:10]
        
        # Return the digits only
        return digits_only

class RestaurantForm(forms.ModelForm):
    class Meta:
        model = Restaurant
        fields = ['name', 'address', 'phone'] 