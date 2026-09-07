import asyncio
import json
import websockets
import urllib.request

async def test_all():
    uri = 'ws://localhost:8000/ws/solve'
    
    print('--- TEST 1: RUN MCTS ---')
    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({'command': 'run_mcts', 'graph_id': 'preset_tiny', 'config': {'iterations': 50}}))
        mcts_events = []
        while True:
            msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
            data = json.loads(msg)
            mcts_events.append(data.get('type'))
            if data.get('type') in ['SEARCH_COMPLETED', 'ERROR']:
                print(f"MCTS Finished: {data.get('type')} | Score: {data.get('best_score')} | Colors: {data.get('num_colors')} | Runtime: {data.get('runtime'):.4f}s")
                break
        assert 'SEARCH_COMPLETED' in mcts_events

    print('--- TEST 2: RUN EXACT ---')
    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({'command': 'run_exact', 'graph_id': 'preset_tiny', 'config': {'time_limit': 5}}))
        exact_events = []
        while True:
            msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
            data = json.loads(msg)
            exact_events.append(data.get('type'))
            if data.get('type') in ['SEARCH_COMPLETED', 'ERROR']:
                print(f"Exact Finished: {data.get('type')} | Score: {data.get('best_score')} | Colors: {data.get('num_colors')} | States: {data.get('states_explored')} | Optimal: {data.get('is_optimal')}")
                break
        assert 'SEARCH_COMPLETED' in exact_events

    print('--- TEST 3: COMPARE ---')
    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({
            'command': 'run_comparison',
            'graph_id': 'preset_tiny',
            'configs': [
                {'algorithm': 'exact', 'time_limit': 5},
                {'algorithm': 'mcts', 'strategy': 'dsatur', 'iterations': 50, 'time_limit': 5}
            ]
        }))
        while True:
            msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
            data = json.loads(msg)
            if data.get('type') == 'COMPARISON_COMPLETED':
                comp_data = data.get('data', {})
                results = comp_data.get('results', {})
                print('Compare Finished!')
                print(f"  Exact Score: {results.get('exact', {}).get('score')} | Status: {results.get('exact', {}).get('status')}")
                print(f"  MCTS Score: {results.get('mcts', {}).get('score')} | Status: {results.get('mcts', {}).get('status')}")
                print(f"  Optimality Gap: {comp_data.get('optimality_gap')}% | Speedup: {comp_data.get('speedup')}x")
                break

    print('--- TEST 4: RUN EXPERIMENTS ---')
    scale_req = urllib.request.Request('http://localhost:8000/api/experiments/scalability', 
        data=json.dumps({
            'graph_sizes': [5, 10],
            'algorithms': [{'algorithm': 'exact'}, {'algorithm': 'mcts', 'strategy': 'dsatur'}],
            'time_limit': 5,
            'iterations': 50,
            'edge_probability': 0.3,
            'num_repetitions': 1,
            'seed': 42
        }).encode('utf-8'), 
        headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(scale_req) as resp:
        res = json.loads(resp.read().decode())
        print(f"Scalability Status: {res.get('status')} | Results Count: {len(res.get('result', []))}")
        for r in res.get('result', []):
            print(f"  Size={r.get('graph_size')} Algo={r.get('algorithm')} ({r.get('simulation_strategy')}) Score={r.get('score')} Colors={r.get('num_colors')} Time={r.get('runtime'):.4f}s Status={r.get('status')}")

    print('ALL 4 TESTS COMPLETED SUCCESSFULLY!')

if __name__ == '__main__':
    asyncio.run(test_all())
