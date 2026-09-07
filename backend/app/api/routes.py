from fastapi import APIRouter, Request, HTTPException, Body
from pydantic import BaseModel
from typing import Optional
from datasets.generator import generate_random_graph

router = APIRouter()


class GenerateConfig(BaseModel):
    num_vertices: int = 10
    edge_probability: float = 0.3
    min_weight: int = 1
    max_weight: int = 100
    seed: Optional[int] = 42
    name: Optional[str] = None


@router.get('/health')
def health_check():
    """Health check endpoint."""
    return {'status': 'healthy', 'message': 'API is running'}


@router.get('/presets')
def list_presets(request: Request):
    """List preset graph names and IDs."""
    graph_service = request.app.state.graph_service
    presets = []
    for info in graph_service.list_graphs():
        if info.source == 'preset':
            presets.append({
                'id': info.id,
                'name': info.name,
                'num_vertices': info.num_vertices,
                'num_edges': info.num_edges,
            })
    return {'presets': presets}


@router.post('/generate')
def generate_graph(request: Request, config: GenerateConfig):
    """Generate a random graph."""
    graph_service = request.app.state.graph_service
    try:
        graph = generate_random_graph(
            num_vertices=config.num_vertices,
            edge_probability=config.edge_probability,
            min_weight=config.min_weight,
            max_weight=config.max_weight,
            seed=config.seed or 42,
        )
        name = config.name or f"Generated ({config.num_vertices}V, p={config.edge_probability})"
        graph_id = graph_service.add_graph(graph, name=name)
        info = graph_service.get_info(graph_id)
        return {
            'status': 'success',
            'graph_id': graph_id,
            'graph_info': info.model_dump() if info else None,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/algorithms')
def list_algorithms():
    """List available algorithms and strategies."""
    return {
        'algorithms': [
            {
                'id': 'exact',
                'name': 'Exact (Branch & Bound)',
                'type': 'exact',
                'strategies': [],
            },
            {
                'id': 'mcts',
                'name': 'Monte Carlo Tree Search',
                'type': 'heuristic',
                'strategies': ['random', 'greedy', 'dsatur'],
            },
        ]
    }
