import asyncio
import json
import time
import urllib.request
import websockets

async def test_200v_mcts():
    # 1. Generate 200V dense graph via REST API
    req = urllib.request.Request(
        'http://localhost:8000/api/generate',
        data=json.dumps({
            'num_vertices': 200,
            'edge_probability': 0.9,
            'min_weight': 1,
            'max_weight': 100,
            'seed': 42,
            'name': '200V Dense Test'
        }).encode(),
        headers={'Content-Type': 'application/json'}
    )
    res = json.loads(urllib.request.urlopen(req).read().decode())
    graph_id = res['graph_id']
    info = res['graph_info']
    print(f"Generated 200V dense graph: id={graph_id}, vertices={info['num_vertices']}, edges={info['num_edges']}")
    
    # 2. Connect to WebSocket
    uri = "ws://127.0.0.1:8000/ws/solve"
    print(f"Connecting to {uri}...")
    t0 = time.time()
    
    async with websockets.connect(uri) as ws:
        print("Connected to WebSocket.")
        await ws.send(json.dumps({
            "command": "run_mcts",
            "graph_id": graph_id,
            "config": {
                "iterations": 100,
                "strategy": "dsatur",
                "time_limit": 10,
                "exploration": 1.414,
                "seed": 42
            }
        }))
        
        event_counts = {}
        final_event = None
        while True:
            msg = await ws.recv()
            event = json.loads(msg)
            t = event.get("type")
            event_counts[t] = event_counts.get(t, 0) + 1
            if event_counts[t] <= 3 or t in ("NEW_BEST_SOLUTION", "SEARCH_COMPLETED", "ERROR"):
                print(f"  [WS Event] {t}: {event.get('message') or event.get('score') or ''}")
            if t in ("SEARCH_COMPLETED", "SEARCH_TIMEOUT", "ERROR"):
                final_event = event
                break
                
        total_time = time.time() - t0
        print(f"\n200V MCTS test completed in {total_time:.2f}s!")
        print(f"Events received: {event_counts}")
        print(f"Final score: {final_event.get('score') or final_event.get('best_score')}, colors: {final_event.get('num_colors')}")
        assert final_event['type'] == 'SEARCH_COMPLETED', f"Expected SEARCH_COMPLETED, got {final_event['type']}"
        print("Verification SUCCESSFUL!")

if __name__ == "__main__":
    asyncio.run(test_200v_mcts())
