from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin # Alias to avoid name clash if needed
from .models import CustomUser, Restaurant

# Admin registration for CustomUser
@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    # Use the same configuration as before from restaurant_app.admin, or customize
    model = CustomUser
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password', 'password2', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
    )

# Admin registration for Restaurant
@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ('name', 'user_email', 'phone', 'created_at')
    search_fields = ('name', 'user__email', 'phone')
    list_filter = ('created_at',)
    raw_id_fields = ('user',) # Useful for OneToOneField to CustomUser

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Owner Email'
