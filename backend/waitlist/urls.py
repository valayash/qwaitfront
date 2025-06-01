from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WaitlistEntryViewSet,
    WaitlistRestaurantConfigAPIView,
    WaitlistRestaurantQRCodeAPIView
)

router = DefaultRouter()
# /api/waitlist/entries/ - for list, create
# /api/waitlist/entries/{pk}/ - for retrieve, update, partial_update, destroy
# /api/waitlist/entries/{pk}/set_status/ - for custom action set_status
# /api/waitlist/entries/data_with_qr/ - for custom list action data_with_qr
router.register(r'entries', WaitlistEntryViewSet, basename='waitlistentry')

# Maps to /api/waitlist/
urlpatterns = [
    path('', include(router.urls)), # Includes all ViewSet default and custom action routes
    
    # Standalone APIViews for restaurant-level waitlist settings
    path('config/', WaitlistRestaurantConfigAPIView.as_view(), name='waitlist-restaurant-config'),
    path('qrcode/', WaitlistRestaurantQRCodeAPIView.as_view(), name='waitlist-restaurant-qrcode'),

    # Old FBV paths are removed as their functionality is now in the ViewSet or new APIViews.
    # Example: path('update-columns/', update_columns_view, name='waitlist-update-columns'), # Now handled by /api/waitlist/config/
    # Example: path('add-party/', add_party_view, name='waitlist-add-party'), # Now handled by POST to /api/waitlist/entries/
    # Example: path('refresh/', refresh_waitlist_view, name='waitlist-refresh'), # Now handled by GET /api/waitlist/entries/
    # Example: path('data/', api_waitlist_data_view, name='waitlist-api-data'), # Now handled by /api/waitlist/entries/data_with_qr/
] 