from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import PlainTextResponse
from types import SimpleNamespace
import json

router = APIRouter()

@router.post('/run')
async def run_experiment(request: Request, config: dict):
    """Run a single experiment."""
    experiment_service = request.app.state.experiment_service
    try:
        cfg = SimpleNamespace(**config)
        result = await experiment_service.run_experiment(cfg, None)
        return {'status': 'success', 'result': [r.model_dump() if hasattr(r, 'model_dump') else r for r in result]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/comparison')
async def run_comparison(request: Request, payload: dict):
    """Run comparison (multiple algorithms on same graph)."""
    experiment_service = request.app.state.experiment_service
    graph_id = payload.get('graph_id')
    configs = payload.get('configs')
    
    if not graph_id or not configs:
        raise HTTPException(status_code=400, detail="Missing graph_id or configs")
        
    try:
        cfg = SimpleNamespace(graph_id=graph_id, algorithms=configs)
        result = await experiment_service.run_experiment(cfg, None)
        return {'status': 'success', 'result': [r.model_dump() if hasattr(r, 'model_dump') else r for r in result]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/scalability')
async def run_scalability(request: Request, payload: dict):
    """Run scalability experiment."""
    experiment_service = request.app.state.experiment_service
    try:
        cfg = SimpleNamespace(**payload)
        result = await experiment_service.run_scalability(cfg, None)
        return {'status': 'success', 'result': [r.model_dump() if hasattr(r, 'model_dump') else r for r in result]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get('/results')
def get_results(request: Request):
    """Get all results."""
    experiment_service = request.app.state.experiment_service
    results = experiment_service.get_results()
    return {'results': [r.model_dump() if hasattr(r, 'model_dump') else r for r in results]}

@router.delete('/results')
def clear_results(request: Request):
    """Clear results."""
    experiment_service = request.app.state.experiment_service
    experiment_service.clear_results()
    return {'status': 'success'}

@router.get('/export/csv')
def export_csv(request: Request):
    """Export results as CSV."""
    experiment_service = request.app.state.experiment_service
    import tempfile
    import os
    with tempfile.NamedTemporaryFile(delete=False) as f:
        path = f.name
    experiment_service.export_csv(path)
    with open(path, 'r') as f:
        csv_data = f.read()
    os.remove(path)
    return PlainTextResponse(content=csv_data, media_type="text/csv")

@router.get('/export/json')
def export_json(request: Request):
    """Export results as JSON."""
    experiment_service = request.app.state.experiment_service
    import tempfile
    import os
    with tempfile.NamedTemporaryFile(delete=False) as f:
        path = f.name
    experiment_service.export_json(path)
    with open(path, 'r') as f:
        json_data = f.read()
    os.remove(path)
    return PlainTextResponse(content=json_data, media_type="application/json")
