from django.db import models
# from restaurant_app.models import Restaurant # Old import
from auth_settings.models import Restaurant # New import

class Party(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='parties_app_entries') # Changed related_name to avoid clash
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15) # Consider adding validators
    visits = models.PositiveIntegerField(default=0)
    last_visit = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ['restaurant', 'phone']
        verbose_name_plural = 'Parties'
        ordering = ['-last_visit', 'name']

    def __str__(self):
        return f"{self.name} ({self.phone}) - {self.restaurant.name}"
