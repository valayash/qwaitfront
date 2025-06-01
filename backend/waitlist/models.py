from django.db import models
from django.utils import timezone
# from restaurant_app.models import Restaurant # Old import
from auth_settings.models import Restaurant # New import

class WaitlistEntry(models.Model):
    STATUS_CHOICES = [
        ('WAITING', 'Waiting'),
        ('SERVED', 'Served'),
        ('REMOVED', 'Removed'),
    ]

    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='waitlist_entries')
    customer_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20) # Increased max_length for various formats
    people_count = models.PositiveIntegerField()
    timestamp = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='WAITING')
    notes = models.TextField(blank=True, null=True)
    quoted_time = models.IntegerField(blank=True, null=True) # In minutes
    # New fields for tracking notifications and service
    notified_at = models.DateTimeField(blank=True, null=True)
    notified_sms_at = models.DateTimeField(blank=True, null=True)
    notified_email_at = models.DateTimeField(blank=True, null=True)
    notification_attempts = models.PositiveIntegerField(default=0)
    completion_time = models.DateTimeField(blank=True, null=True) # When status becomes SERVED or REMOVED

    def __str__(self):
        return f"{self.customer_name} ({self.people_count}) at {self.restaurant.name} - {self.get_status_display()}"

    @property
    def wait_time_minutes(self):
        if self.status != 'WAITING':
            if self.completion_time:
                time_diff_seconds = (self.completion_time - self.timestamp).total_seconds()
            else: # Fallback if completion_time isn't set for a non-waiting status
                return 0 
        else:
            time_diff_seconds = (timezone.now() - self.timestamp).total_seconds()
        return int(time_diff_seconds / 60)

    def save(self, *args, **kwargs):
        if self.status in ['SERVED', 'REMOVED'] and not self.completion_time:
            self.completion_time = timezone.now()
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['timestamp']
        verbose_name = "Waitlist Entry"
        verbose_name_plural = "Waitlist Entries"
