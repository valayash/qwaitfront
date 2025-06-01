from django.contrib import admin
from .models import Party

@admin.register(Party)
class PartyAdmin(admin.ModelAdmin):
    list_display = ('name', 'restaurant', 'phone', 'visits', 'last_visit', 'created_at')
    search_fields = ('name', 'phone', 'restaurant__name')
    list_filter = ('restaurant', 'last_visit', 'visits')
    date_hierarchy = 'last_visit' # Or 'created_at'
    ordering = ('-last_visit',)

    fieldsets = (
        (None, {
            'fields': ('restaurant', 'name', 'phone')
        }),
        ('Visit Information', {
            'fields': ('visits', 'last_visit', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at',)
