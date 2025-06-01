from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
# from django.conf import settings # Not strictly needed for model definitions but often useful

# CustomUser and Restaurant models are moved here from restaurant_app.models

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True) # Superusers should be active by default

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    username = None # Remove username field, use email as unique identifier
    email = models.EmailField(_('email address'), unique=True)
    # Add any other custom fields for your user here, e.g.:
    # phone_number = models.CharField(max_length=15, blank=True, null=True)
    # profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = [] # e.g. ['first_name', 'last_name'] if you want them required at creation via createsuperuser
    
    objects = CustomUserManager()

    def __str__(self):
        return self.email

    # Add any custom methods for your user model if needed

class Restaurant(models.Model):
    """Restaurant model representing each business using the queue system"""
    # The user is the owner of the restaurant
    user = models.OneToOneField(
        CustomUser, # settings.AUTH_USER_MODEL could also be used after settings are configured
        on_delete=models.CASCADE, 
        related_name='restaurant_profile' # Changed related_name to avoid clash with user.restaurant if any from old setup
    ) 
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=200, blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True) # Consider validators e.g. PhoneNumberField
    logo = models.ImageField(upload_to='restaurant_logos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
        
    # Waitlist specific configurations previously on Restaurant model
    waitlist_columns = models.JSONField(default=list, blank=True) # Default columns for waitlist display
    
    # Optional settings that were on the old Restaurant model
    max_queue_size = models.IntegerField(default=50) # This might belong to a WaitlistConfig model
    sms_notifications = models.BooleanField(default=False) # This might belong to a NotificationConfig model

    # related_name for WaitlistEntry.restaurant is 'waitlist_entries'
    # related_name for Reservation.restaurant is 'reservations'
    # related_name for Party.restaurant is 'parties_app_entries'
    
    def __str__(self):
        return self.name
    
    # active_queue_count was previously here, using self.waitlist_entries (from waitlist.models)
    # If Restaurant model needs this method, it would require importing WaitlistEntry
    # from waitlist.models, creating a circular dependency if waitlist.models imports Restaurant from here.
    # It's better to have such methods on managers or as utility functions if they cross app boundaries extensively.
    # For now, removing it from here. It can be a method on RestaurantManager or a standalone utility.
    # def active_queue_count(self):
    #     from waitlist.models import WaitlistEntry # This would be a circular import if waitlist.models imports this Restaurant
    #     return WaitlistEntry.objects.filter(restaurant=self, status='WAITING').count()

    class Meta:
        verbose_name = _('Restaurant')
        verbose_name_plural = _('Restaurants')
