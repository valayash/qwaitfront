# waitlist/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
# from asgiref.sync import async_to_sync # Not currently used in this consumer but can be useful

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
        print(f"WebSocket connected to group {self.group_name} for channel {self.channel_name}")

        # Optionally, send existing waitlist on connect
        # from .models import WaitlistEntry # Adjusted for relative import
        # from .serializers import WaitlistEntrySerializer # Adjusted for relative import
        # entries = await database_sync_to_async(list)(WaitlistEntry.objects.filter(restaurant_id=self.restaurant_id, status="WAITING").order_by('timestamp'))
        # serializer = WaitlistEntrySerializer(entries, many=True)
        # await self.send(text_data=json.dumps({
        #     'type': 'initial_waitlist_data', # Or a more descriptive type
        #     'payload': serializer.data
        # }))

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
            print(f"WebSocket disconnected from group {self.group_name} for channel {self.channel_name}")

    async def send_waitlist_update(self, event):
        """ Handles messages from the backend for new or updated entries. """
        entry_data = event['data']
        await self.send(text_data=json.dumps({
            'type': 'send.waitlist.update', # Changed from 'ENTRY_UPDATED'
            'data': entry_data             # Changed from 'payload'
        }))
        print(f"Sent send.waitlist.update to client in group {self.group_name}")

    async def send_waitlist_remove(self, event):
        """ Handles messages from the backend for removed entries. """
        # The event data from broadcast_waitlist_update for remove is {'id': entry_id, 'status': 'REMOVED'}
        removed_entry_id = event['data']['id'] 
        await self.send(text_data=json.dumps({
            'type': 'send.waitlist.remove', # Changed from 'ENTRY_REMOVED'
            'data': {'id': removed_entry_id} # Changed from 'payload'
        }))
        print(f"Sent send.waitlist.remove to client in group {self.group_name} for ID {removed_entry_id}")

    # Optional: Handler for general configuration changes or full refresh signals
    # async def send_config_update(self, event):
    #     """ Handles messages for configuration changes. """
    #     await self.send(text_data=json.dumps({
    #         'type': 'CONFIG_UPDATED',
    #         'payload': event['data']
    #     }))
    #     print(f"Sent CONFIG_UPDATED to client in group {self.group_name}") 