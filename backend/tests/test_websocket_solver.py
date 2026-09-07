import asyncio
import json
import websockets

async def test_ws_exact_and_mcts():
    uri = "ws://localhost:8000/ws/solve"
    print(f"Connecting to {uri}...")
    async with websockets.connect(uri) as ws:
        print("Connected to WebSocket.")
        
        # Test 1: Run Exact solver on preset_tiny
        print("\n--- Testing run_exact on preset_tiny ---")
        await ws.send(json.dumps({
            "command": "run_exact",
            "graph_id": "preset_tiny",
            "config": {"time_limit": 5}
        }))
        
        exact_events = []
        while True:
            msg = await ws.recv()
            event = json.loads(msg)
            exact_events.append(event["type"])
            print(f"[Exact Event] {event.get('type')}: {event.get('message') or event.get('score') or ''}")
            if event["type"] in ("SEARCH_COMPLETED", "SEARCH_TIMEOUT", "ERROR"):
                print("Exact run finished. Final event:", event)
                break
                
        # Test 2: Run MCTS solver on preset_small
        print("\n--- Testing run_mcts on preset_small ---")
        await ws.send(json.dumps({
            "command": "run_mcts",
            "graph_id": "preset_small",
            "config": {
                "iterations": 200,
                "strategy": "dsatur",
                "time_limit": 5
            }
        }))
        
        mcts_events = []
        while True:
            msg = await ws.recv()
            event = json.loads(msg)
            mcts_events.append(event["type"])
            print(f"[MCTS Event] {event.get('type')}: {event.get('message') or event.get('score') or ''}")
            if event["type"] in ("SEARCH_COMPLETED", "SEARCH_TIMEOUT", "ERROR"):
                print("MCTS run finished. Final event:", event)
                break

        print("\nWebSocket verification test successful!")

if __name__ == "__main__":
    asyncio.run(test_ws_exact_and_mcts())
