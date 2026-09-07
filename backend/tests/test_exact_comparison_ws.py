import asyncio
import json
import time
import websockets

async def test_exact_and_comparison():
    uri = "ws://127.0.0.1:8000/ws/solve"
    async with websockets.connect(uri) as ws:
        # 1. Test Exact on preset_small
        print("--- Testing RUN EXACT on preset_small ---")
        await ws.send(json.dumps({
            "command": "run_exact",
            "graph_id": "preset_small",
            "config": {"time_limit": 5}
        }))
        while True:
            msg = await ws.recv()
            event = json.loads(msg)
            t = event.get("type")
            if t in ("SEARCH_STARTED", "BEST_SOLUTION_UPDATED", "SEARCH_COMPLETED", "ERROR"):
                print(f"  [Exact Event] {t}: score={event.get('score') or event.get('best_score')}")
            if t in ("SEARCH_COMPLETED", "ERROR"):
                assert event.get("is_optimal") == True, "Exact should report is_optimal=True"
                print(f"  Exact finished successfully with optimal score: {event.get('best_score')}")
                break

        # 2. Test Comparison on preset_tiny
        print("\n--- Testing RUN COMPARISON on preset_tiny ---")
        await ws.send(json.dumps({
            "command": "run_comparison",
            "graph_id": "preset_tiny",
            "configs": [
                {"algorithm": "exact", "time_limit": 5},
                {"algorithm": "mcts", "strategy": "dsatur", "iterations": 100, "time_limit": 5}
            ]
        }))
        comparison_events = 0
        while True:
            msg = await ws.recv()
            event = json.loads(msg)
            comparison_events += 1
            t = event.get("type")
            if t in ("SEARCH_STARTED", "NEW_BEST_SOLUTION", "SEARCH_COMPLETED", "ERROR"):
                print(f"  [Comparison Event] {t}: {event.get('message') or event.get('score')}")
            if t in ("SEARCH_COMPLETED", "ERROR") and comparison_events > 5:
                print("  Comparison finished successfully!")
                break

    print("\nExact & Comparison verification SUCCESSFUL!")

if __name__ == "__main__":
    asyncio.run(test_exact_and_comparison())
