from django.db import models
from django.conf import settings # To get AUTH_USER_MODEL if needed, though Restaurant links to CustomUser directly
from auth_settings.models import Restaurant # New import
from django.utils import timezone
from django.core.exceptions import ValidationError

class Reservation(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='reservations')
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15) # Consider E.164 validator/field
    party_size = models.PositiveIntegerField(default=1)
    date = models.DateField()
    time = models.TimeField()
    notes = models.TextField(blank=True, null=True)
    checked_in = models.BooleanField(default=False)
    check_in_time = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.date.strftime('%Y-%m-%d')} at {self.time.strftime('%I:%M %p')} ({self.restaurant.name})"

    def clean(self):
        # Ensure reservation date is not in the past.
        if self.date < timezone.now().date():
            raise ValidationError({'date': "Reservation date cannot be in the past."})
        # Ensure reservation time on the same day is not in the past.
        if self.date == timezone.now().date() and self.time < timezone.now().time():
            raise ValidationError({'time': "Reservation time cannot be in the past on the current date."})
        # Ensure party size is positive
        if self.party_size <= 0:
            raise ValidationError({'party_size': "Party size must be greater than zero."})

    class Meta:
        ordering = ['date', 'time']
        unique_together = ['restaurant', 'phone', 'date', 'time']
