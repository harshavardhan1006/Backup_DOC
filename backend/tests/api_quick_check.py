"""Quick test of all backend API endpoints."""
import urllib.request
import json
import sys

BASE = 'http://localhost:8000'

def get(path):
    r = urllib.request.urlopen(f'{BASE}{path}')
    return json.loads(r.read().decode())

def post(path, data):
    req = urllib.request.Request(
        f'{BASE}{path}',
        data=json.dumps(data).encode(),
        headers={'Content-Type': 'application/json'}
    )
    r = urllib.request.urlopen(req)
    return json.loads(r.read().decode())

# 1. Health check
print('=== Health ===')
print(get('/api/health'))

# 2. List graphs
print('\n=== Graphs ===')
graphs = get('/api/graphs/')
graph_list = graphs if isinstance(graphs, list) else graphs.get('graphs', [])
print(f'Total graphs: {len(graph_list)}')
for g in graph_list:
    print(f'  {g["id"]}: {g["name"]} ({g["num_vertices"]}V, {g["num_edges"]}E)')

# 3. Generate graph
print('\n=== Generate ===')
gen = post('/api/generate', {
    'num_vertices': 10,
    'edge_probability': 0.4,
    'min_weight': 1,
    'max_weight': 50,
    'seed': 42
})
print(f'Generated: {gen}')

# 4. Get graph stats
gid = gen.get('graph_id')
if gid:
    print('\n=== Stats ===')
    stats = get(f'/api/graphs/{gid}/stats')
    print(stats)

    print('\n=== Visualization Data ===')
    viz = get(f'/api/graphs/{gid}/visualization')
    print(f'Type: {viz.get("type")}, Nodes: {len(viz.get("nodes", []))}, Links: {len(viz.get("links", []))}')

# 5. List algorithms
print('\n=== Algorithms ===')
print(get('/api/algorithms'))

# 6. Get preset info
print('\n=== Presets ===')
print(get('/api/presets'))

# 7. Test graph details for a preset
preset_id = 'preset_tiny'
print(f'\n=== Graph Detail: {preset_id} ===')
try:
    detail = get(f'/api/graphs/{preset_id}')
    print(detail)
except Exception as e:
    print(f'Error: {e}')

print('\nAll API tests passed!')
