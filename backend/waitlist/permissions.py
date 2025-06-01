from rest_framework import permissions
# from restaurant_app.models import Restaurant # Old import
from auth_settings.models import Restaurant # New import
from .models import WaitlistEntry

class IsRestaurantOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of a restaurant to access/edit associated objects.
    This permission assumes that the view's queryset is already filtered for the user's restaurant,
    or that the object being checked (via has_object_permission) has a `restaurant` attribute.
    """

    def has_permission(self, request, view):
        # Check if the user is authenticated and has an associated restaurant profile.
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            # For views that operate on the user's restaurant directly (e.g., WaitlistEntryViewSet)
            # where the restaurant is implicitly request.user.restaurant_profile
            return hasattr(request.user, 'restaurant_profile') and request.user.restaurant_profile is not None
        except Restaurant.DoesNotExist:
            return False
        # For views where restaurant_id is in URL, that check is generally better handled
        # by the view itself or by has_object_permission if an object is fetched.
        # This base has_permission ensures the user is at least a restaurant owner.

    def has_object_permission(self, request, view, obj):
        # For object-level permissions, check if the object's restaurant is owned by the user.
        # Assumes `obj` has a `restaurant` attribute that links to the Restaurant model.
        if hasattr(obj, 'restaurant'): # e.g., WaitlistEntry instance
            return obj.restaurant.user == request.user
        # If the object itself is a Restaurant instance (e.g., when WaitlistRestaurantConfigAPIView calls self.get_object())
        if isinstance(obj, Restaurant):
            return obj.user == request.user
        return False

    # Removed stray `return True` from outside any method 