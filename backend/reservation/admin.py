from django.contrib import admin
from .models import Reservation

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('name', 'restaurant', 'phone', 'date', 'time', 'party_size', 'checked_in', 'created_at')
    list_filter = ('date', 'checked_in', 'restaurant')
    search_fields = ('name', 'phone', 'restaurant__name', 'notes')
    date_hierarchy = 'date'
    ordering = ('date', 'time')

    fieldsets = (
        ('Restaurant Info', {
            'fields': ('restaurant',)
        }),
        ('Customer Information', {
            'fields': ('name', 'phone', 'party_size')
        }),
        ('Reservation Details', {
            'fields': ('date', 'time', 'notes')
        }),
        ('Status', {
            'fields': ('checked_in', 'check_in_time')
        }),
    )
    readonly_fields = ('check_in_time', 'created_at')
