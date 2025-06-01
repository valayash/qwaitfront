from rest_framework import serializers
from .models import Reservation
# from restaurant_app.models import Restaurant # Old import
from auth_settings.models import Restaurant # New import
from django.utils import timezone

# A serializer for basic Restaurant info, to be nested if needed.
class BasicRestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = ['id', 'name'] # Only include essential fields

class ReservationSerializer(serializers.ModelSerializer):
    # restaurant = BasicRestaurantSerializer(read_only=True) # Example of nesting restaurant details
    # restaurant_id = serializers.PrimaryKeyRelatedField(queryset=Restaurant.objects.all(), source='restaurant', write_only=True)

    time = serializers.TimeField(format='%H:%M', input_formats=['%H:%M', '%I:%M %p', '%I:%M%p'])
    date = serializers.DateField(format='%Y-%m-%d', input_formats=['%Y-%m-%d'])

    class Meta:
        model = Reservation
        fields = '__all__'
        # To make restaurant writable by ID but readable as nested object:
        # fields = ['id', 'restaurant_id', 'name', 'phone', 'party_size', 'date', 'time', 'notes', 'checked_in', 'check_in_time', 'created_at', 'restaurant']
        # read_only_fields = ['created_at'] # 'restaurant' would be read_only if using nested serializer

    def validate(self, data):
        # Ensure reservation date is not in the past.
        # This validation is also in the model's clean() method, but DRF serializers run their validation first.
        if 'date' in data and data['date'] < timezone.now().date():
            raise serializers.ValidationError({"date": "Reservation date cannot be in the past."})
        
        if 'date' in data and 'time' in data and data['date'] == timezone.now().date() and data['time'] < timezone.now().time():
            raise serializers.ValidationError({"time": "Reservation time cannot be in the past on the current date."})

        # Ensure party size is positive
        if 'party_size' in data and data['party_size'] <= 0:
            raise serializers.ValidationError({"party_size": "Party size must be greater than zero."})
        
        # Add check for unique_together if not relying solely on model validation for user feedback
        # This is particularly useful for PUT requests where the instance is being updated.
        # For POST, model's unique_together will raise IntegrityError handled by the view.
        # For PUT, this provides cleaner error messages before hitting DB.
        # instance = self.instance # Available on updates
        # if instance:
        #     # Exclude current instance from uniqueness check
        #     queryset = Reservation.objects.filter(
        #         restaurant=data.get('restaurant', instance.restaurant),
        #         phone=data.get('phone', instance.phone),
        #         date=data.get('date', instance.date),
        #         time=data.get('time', instance.time)
        #     ).exclude(pk=instance.pk)
        # else:
        #     # For create operations
        #     queryset = Reservation.objects.filter(
        #         restaurant=data.get('restaurant'),
        #         phone=data.get('phone'),
        #         date=data.get('date'),
        #         time=data.get('time')
        #     )
        # if queryset.exists():
        #     raise serializers.ValidationError("A reservation with these details already exists for this restaurant.")
            
        return data 