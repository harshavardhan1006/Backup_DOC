from fastapi import WebSocket
import json
import asyncio
from typing import Dict, Set

class ConnectionManager:
    """Manages active WebSocket connections."""
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept a new connection and store it."""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        
    def disconnect(self, client_id: str):
        """Remove a connection."""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            
    async def send_event(self, client_id: str, event: dict):
        """Send an event to a specific client."""
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            try:
                await websocket.send_json(event)
            except Exception as e:
                print(f"Error sending to {client_id}: {e}")
                self.disconnect(client_id)
                
    async def broadcast(self, event: dict):
        """Send an event to all connected clients."""
        for client_id, websocket in list(self.active_connections.items()):
            try:
                await websocket.send_json(event)
            except Exception as e:
                print(f"Error broadcasting to {client_id}: {e}")
                self.disconnect(client_id)

manager = ConnectionManager()
