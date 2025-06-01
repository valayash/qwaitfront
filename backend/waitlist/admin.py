from django.contrib import admin
from .models import WaitlistEntry

@admin.register(WaitlistEntry)
class WaitlistEntryAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'restaurant',
        'customer_name',
        'phone_number',
        'people_count',
        'status',
        'notes',
        'timestamp',
        'quoted_time',
        'notified_at',
        'completion_time'
    )
    list_filter = ('status', 'restaurant', 'timestamp', 'notified_at')
    search_fields = ('customer_name', 'phone_number', 'restaurant__name', 'notes')
    list_editable = ('status', 'notes', 'quoted_time')
    date_hierarchy = 'timestamp'
    readonly_fields = ('id', 'created_at_display') # Assuming created_at might be the timestamp or another field

    fieldsets = (
        (None, {
            'fields': ('restaurant', 'customer_name', 'phone_number', 'people_count')
        }),
        ('Status & Timing', {
            'fields': ('status', 'timestamp', 'quoted_time', 'completion_time')
        }),
        ('Notifications', {
            'fields': ('notified_at', 'notified_sms_at', 'notified_email_at', 'notification_attempts'),
            'classes': ('collapse',)
        }),
        ('Additional Info', {
            'fields': ('notes',)
        }),
    )

    def created_at_display(self, obj):
        return obj.timestamp # Or whichever field represents creation time
    created_at_display.short_description = 'Created At'

# If you have other models in the waitlist app, register them here.
