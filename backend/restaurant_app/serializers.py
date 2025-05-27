from rest_framework import serializers
from .models import QueueEntry

class QueueEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = QueueEntry
        fields = [
            'id',
            'customer_name',
            'phone_number',
            'people_count',
            'timestamp',
            'quoted_time',
            'notes',
            'status',
            'restaurant'
        ]
        read_only_fields = ['id', 'timestamp']  # These fields are automatically set
        
    def validate_people_count(self, value):
        """
        Check that people_count is positive
        """
        if value <= 0:
            raise serializers.ValidationError("Party size must be positive")
        return value

    def validate_phone_number(self, value):
        """
        Ensure phone number is provided
        """
        if not value:
            raise serializers.ValidationError("Phone number is required")
        return value

    def validate_customer_name(self, value):
        """
        Ensure customer name is provided
        """
        if not value:
            raise serializers.ValidationError("Customer name is required")
        return value 