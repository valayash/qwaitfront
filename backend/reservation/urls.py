from django.urls import path
from .views import (
    ReservationListCreateAPIView,
    ReservationDetailAPIView,
    ReservationCheckInAPIView,
    ServedPartyListAPIView
)

urlpatterns = [
    # Path for listing reservations for a specific restaurant and creating a new one
    path('restaurants/<int:restaurant_id>/reservations/', ReservationListCreateAPIView.as_view(), name='list_create_reservations'),
    
    # Path for retrieving, updating, or deleting a specific reservation
    path('restaurants/<int:restaurant_id>/reservations/<int:pk>/', ReservationDetailAPIView.as_view(), name='reservation_detail_actions'),
    
    # Path for checking in a reservation
    path('restaurants/<int:restaurant_id>/reservations/<int:pk>/check-in/', ReservationCheckInAPIView.as_view(), name='reservation_check_in'),
    
    # Path for listing served parties for a specific restaurant
    path('restaurants/<int:restaurant_id>/served-parties/', ServedPartyListAPIView.as_view(), name='list_served_parties'),
] 