from fastapi import APIRouter, Request, HTTPException, UploadFile, File
import math
import random
from datasets.importer import import_graph

router = APIRouter()

@router.get('/')
def list_graphs(request: Request):
    """List all graphs."""
    graph_service = request.app.state.graph_service
    graphs = graph_service.list_graphs()
    return [g.model_dump() for g in graphs]

@router.get('/{graph_id}')
def get_graph(graph_id: str, request: Request):
    """Get graph details."""
    graph_service = request.app.state.graph_service
    graph = graph_service.get_graph(graph_id)
    if not graph:
        raise HTTPException(status_code=404, detail="Graph not found")
        
    info = graph_service.get_info(graph_id)
    return {
        'info': info.model_dump(),
        'graph': graph.to_dict(),
        'stats': graph.get_statistics(),
    }

@router.get('/{graph_id}/stats')
def get_graph_stats(graph_id: str, request: Request):
    """Get graph statistics."""
    graph_service = request.app.state.graph_service
    graph = graph_service.get_graph(graph_id)
    if not graph:
        raise HTTPException(status_code=404, detail="Graph not found")
    return graph.get_statistics()

@router.get('/{graph_id}/visualization')
def get_graph_visualization(graph_id: str, request: Request):
    """Get visualization data (adaptive)."""
    graph_service = request.app.state.graph_service
    graph = graph_service.get_graph(graph_id)
    if not graph:
        raise HTTPException(status_code=404, detail="Graph not found")
        
    info = graph_service.get_info(graph_id)
    n = info.num_vertices
    
    nodes = []
    links = []
    
    # Circular layout for initial positions
    def get_positions(num_nodes):
        pos = []
        for i in range(num_nodes):
            angle = 2 * math.pi * i / num_nodes
            radius = 100 + (num_nodes * 2) # Arbitrary scaling
            pos.append({'x': radius * math.cos(angle), 'y': radius * math.sin(angle)})
        return pos

    if n <= 200:
        # Full render
        positions = get_positions(n)
        for i in range(n):
            nodes.append({'id': i, 'weight': graph.weights[i], 'x': positions[i]['x'], 'y': positions[i]['y']})
        for u in range(n):
            for v in graph.adj[u]:
                if u < v:
                    links.append({'source': u, 'target': v})
        return {'nodes': nodes, 'links': links, 'type': 'full'}
        
    elif n <= 5000:
        # Sampled render
        sample_size = min(200, n)
        sampled_vertices = random.sample(range(n), sample_size)
        sampled_ids = set(sampled_vertices)
        
        positions = get_positions(len(sampled_vertices))
        for i, v in enumerate(sampled_vertices):
            nodes.append({'id': v, 'weight': graph.weights[v], 'x': positions[i]['x'], 'y': positions[i]['y']})
            
        for u in sampled_ids:
            for v in graph.adj[u]:
                if v in sampled_ids and u < v:
                    links.append({'source': u, 'target': v})
                    
        return {'nodes': nodes, 'links': links, 'type': 'sampled'}
        
    else:
        # Stats only
        return {'stats': {'vertices': n, 'edges': graph.num_edges()}, 'type': 'summary'}

@router.delete('/{graph_id}')
def delete_graph(graph_id: str, request: Request):
    """Delete a graph."""
    graph_service = request.app.state.graph_service
    success = graph_service.delete_graph(graph_id)
    if not success:
        raise HTTPException(status_code=404, detail="Graph not found")
    return {'status': 'success'}

@router.post('/upload')
async def upload_graph(request: Request, file: UploadFile = File(...)):
    """Upload a graph file."""
    graph_service = request.app.state.graph_service
    content = await file.read()
    try:
        content_str = content.decode('utf-8')
        result = import_graph(content_str, file.filename)
        if result.is_valid:
            graph_id = graph_service.add_graph(result.graph, file.filename, source='upload')
            return {'status': 'success', 'graph_id': graph_id, 'stats': result.stats}
        else:
            raise HTTPException(status_code=400, detail=f"Invalid graph: {result.errors}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Upload failed: {str(e)}")

@router.post('/import')
async def import_graph_endpoint(request: Request, payload: dict):
    """Import from text content."""
    graph_service = request.app.state.graph_service
    content = payload.get('content')
    filename = payload.get('filename', 'imported_graph.txt')
    if not content:
        raise HTTPException(status_code=400, detail="Missing content")
        
    try:
        result = import_graph(content, filename)
        if result.is_valid:
            graph_id = graph_service.add_graph(result.graph, filename, source='import')
            return {'status': 'success', 'graph_id': graph_id, 'stats': result.stats}
        else:
            raise HTTPException(status_code=400, detail=f"Invalid graph: {result.errors}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")
