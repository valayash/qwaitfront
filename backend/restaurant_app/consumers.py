# waitlist_app/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync # For calling async from sync code

# WAITLIST_GROUP_NAME can be removed if all groups are dynamic
# WAITLIST_GROUP_NAME = "waitlist_group" 

class WaitlistConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.restaurant_id = self.scope['url_route']['kwargs']['restaurant_id']
        self.group_name = f"waitlist_{self.restaurant_id}"

        # Join restaurant-specific group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()
        print(f"WebSocket connected to group {self.group_name}: {self.channel_name}")

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
        # Leave restaurant-specific group
        if hasattr(self, 'group_name'): # Ensure group_name was set
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
            print(f"WebSocket disconnected from group {self.group_name}: {self.channel_name}")

    async def send_waitlist_update(self, event):
        """
        Handles messages from the backend view for new or updated entries.
        Sends a message to the client, which can then decide if it's a new entry or an update.
        """
        entry_data = event['data']
        
        # Determine if it's a new entry or an update based on what the view sends.
        # For simplicity, we'll use a generic type. 
        # Or, the view could include an 'action' field in event['data'] or event itself.
        # Let's assume the frontend will determine if it's new or existing by checking its local state.
        
        await self.send(text_data=json.dumps({
            # The frontend Waitlist.jsx handles NEW_WAITLIST_ENTRY and ENTRY_UPDATED.
            # We need to decide which one to send or have a more generic one.
            # If event['action'] == 'create': client_message_type = 'NEW_WAITLIST_ENTRY' else: client_message_type = 'ENTRY_UPDATED'
            # For now, let's assume the view that called this implies an update or creation of a single entry.
            'type': 'ENTRY_UPDATED', # Frontend can treat this as "add if not exist, else update"
            'payload': entry_data
        }))
        print(f"Sent ENTRY_UPDATED to client in group {self.group_name}")

    async def send_waitlist_remove(self, event):
        """
        Handles messages from the backend view for removed entries.
        """
        removed_entry_id = event['data']['id']
        await self.send(text_data=json.dumps({
            'type': 'ENTRY_REMOVED',
            'payload': {'id': removed_entry_id}
        }))
        print(f"Sent ENTRY_REMOVED to client in group {self.group_name} for ID {removed_entry_id}")

    # async def receive(self, text_data):
    #     # If you need to receive messages from clients
    #     text_data_json = json.loads(text_data)
    #     message = text_data_json['message']
    #     # Handle received message, e.g., broadcast to others or process
    #     print(f"Received message: {message} from {self.channel_name}")