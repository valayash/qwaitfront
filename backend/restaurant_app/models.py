from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _

# Add Custom User Model
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    username = None
    email = models.EmailField(_('email address'), unique=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    objects = CustomUserManager()

    def __str__(self):
        return self.email

# Update Restaurant Model to use CustomUser
class Restaurant(models.Model):
    """Restaurant model representing each business using the queue system"""
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='restaurant') 
    waitlist_columns = models.JSONField(default=list)
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=200, blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    logo = models.ImageField(upload_to='restaurant_logos/', blank=True, null=True)
    # Remove email field since it's now in CustomUser
    created_at = models.DateTimeField(auto_now_add=True)
        
        
    # Optional settings
    max_queue_size = models.IntegerField(default=50)
    sms_notifications = models.BooleanField(default=False)
    
    def __str__(self):
        return self.name
    
    def active_queue_count(self):
        """Return count of active entries in queue"""
        return self.queue_entries.filter(status='WAITING').count()
    
    

class QueueEntry(models.Model):
    STATUS_CHOICES = [
        ('WAITING', 'Waiting'),
        ('SERVED', 'Served'),
        ('REMOVED', 'Removed'),
    ]

    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='queue_entries')
    customer_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15)
    people_count = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='WAITING')
    notes = models.TextField(blank=True, null=True)
    quoted_time = models.IntegerField(blank=True, null=True)
    reversed_status = models.CharField(max_length=10, choices=STATUS_CHOICES, blank=True, null=True)

    def __str__(self):
        return f"{self.customer_name} ({self.people_count} people) - {self.get_status_display()}"
    
    @property
    def wait_time_minutes(self):
        """Calculate wait time in minutes since arrival"""
        from django.utils import timezone
        current_time = timezone.now()
        time_diff = (current_time - self.timestamp).total_seconds() / 60
        return int(time_diff)
    
    
from django.db import models
from django.utils import timezone

class Party(models.Model):
    restaurant = models.ForeignKey('Restaurant', on_delete=models.CASCADE, related_name='parties')
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    visits = models.PositiveIntegerField(default=0)
    last_visit = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)  # Adding notes field

    class Meta:
        unique_together = ['restaurant', 'phone']
        verbose_name_plural = 'Parties'

    def __str__(self):
        return f"{self.name} ({self.phone})"
    
class Reservation(models.Model):
    restaurant = models.ForeignKey('Restaurant', on_delete=models.CASCADE, related_name='reservations')
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    party_size = models.PositiveIntegerField(default=1)
    date = models.DateField()
    time = models.TimeField()
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    checked_in = models.BooleanField(default=False)
    check_in_time = models.DateTimeField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.name} - {self.date} at {self.time}"



