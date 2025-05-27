from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Restaurant, QueueEntry, Party, Reservation, CustomUser

# Custom User Admin
@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'is_staff', 'date_joined')
    search_fields = ('email',)
    ordering = ('-date_joined',)

# Restaurant Admin
@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ('name', 'get_user_email', 'created_at')  # Changed
    search_fields = ('name', 'user__email')  # Search by user email
    
    def get_user_email(self, obj):
        return obj.user.email
    get_user_email.short_description = 'Owner Email'  # Column header

@admin.register(QueueEntry)
class QueueEntryAdmin(admin.ModelAdmin):
    list_display = ('restaurant', 'customer_name', 'phone_number', 'people_count', 'status', 'timestamp')

@admin.register(Party)
class PartyAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'restaurant', 'visits', 'last_visit', 'created_at', 'notes')
    list_filter = ('restaurant', 'visits')
    search_fields = ('name', 'phone')
    ordering = ('-created_at',)


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'restaurant', 'date', 'time', 'party_size', 'created_at')
    list_filter = ('restaurant', 'date', 'party_size')
    search_fields = ('name', 'phone', 'notes')
    date_hierarchy = 'date'
    ordering = ('date', 'time')
    
    fieldsets = (
        ('Customer Information', {
            'fields': ('name', 'phone', 'restaurant')
        }),
        ('Reservation Details', {
            'fields': ('date', 'time', 'party_size', 'notes')
        })
    )


