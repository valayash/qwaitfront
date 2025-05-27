# waitlist_app/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync # For calling async from sync code

WAITLIST_GROUP_NAME = "waitlist_group" # A unique name for this group

class WaitlistConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Add this channel to the group
        await self.channel_layer.group_add(
            WAITLIST_GROUP_NAME,
            self.channel_name
        )
        await self.accept()
        print(f"WebSocket connected: {self.channel_name}")

        # Optionally, send existing waitlist on connect
        # from .models import WaitlistEntry
        # from .serializers import WaitlistEntrySerializer
        # entries = WaitlistEntry.objects.filter(status="Waiting").order_by('submitted_at')
        # serializer = WaitlistEntrySerializer(entries, many=True)
        # await self.send(text_data=json.dumps({
        #     'type': 'initial_waitlist',
        #     'data': serializer.data
        # }))


    async def disconnect(self, close_code):
        # Remove this channel from the group
        await self.channel_layer.group_discard(
            WAITLIST_GROUP_NAME,
            self.channel_name
        )
        print(f"WebSocket disconnected: {self.channel_name}")

    # This method is called when a message is sent to the group
    # The 'type' in the group_send call (e.g., 'send.waitlist.update')
    # maps to a method name like 'send_waitlist_update'
    async def send_waitlist_update(self, event):
        """
        Handles messages sent to the group with type 'send.waitlist.update'.
        Sends the message data (the new waitlist entry) to the WebSocket client.
        """
        message_data = event['data']
        await self.send(text_data=json.dumps({
            'type': 'new_entry', # Custom type for frontend to identify
            'data': message_data
        }))

    # async def receive(self, text_data):
    #     # If you need to receive messages from clients
    #     text_data_json = json.loads(text_data)
    #     message = text_data_json['message']
    #     # Handle received message, e.g., broadcast to others or process
    #     print(f"Received message: {message} from {self.channel_name}")