from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import sys

# Add parent directory to path so imports work
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = FastAPI(
    title='WVCP VisualLab',
    description='Interactive visualization for Weighted Vertex Coloring Problem',
    version='1.0.0'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Mocking services if they don't exist yet, to prevent import errors during initial setup
class MockService:
    def __getattr__(self, name):
        def method(*args, **kwargs):
            print(f"Called {self.__class__.__name__}.{name}")
            return {"status": "mock"}
        return method

try:
    from app.services.graph_service import GraphService
    from app.services.solver_service import SolverService
    from app.services.experiment_service import ExperimentService
    graph_service = GraphService()
    if hasattr(graph_service, 'load_presets'):
        graph_service.load_presets()
    solver_service = SolverService(graph_service)
    experiment_service = ExperimentService(graph_service, solver_service)
except ImportError:
    print("Warning: Services not fully implemented yet, using mocks.")
    graph_service = MockService()
    solver_service = MockService()
    experiment_service = MockService()

# Store services on app.state
app.state.graph_service = graph_service
app.state.solver_service = solver_service
app.state.experiment_service = experiment_service

# Include routers
from app.api.routes import router as api_router
from app.api.graph_routes import router as graph_router
from app.api.experiment_routes import router as experiment_router
from app.websocket.handlers import router as ws_router

app.include_router(api_router, prefix='/api')
app.include_router(graph_router, prefix='/api/graphs')
app.include_router(experiment_router, prefix='/api/experiments')
app.include_router(ws_router, prefix='/ws')

@app.get('/')
def root():
    return {'message': 'WVCP VisualLab API', 'version': '1.0.0'}

if __name__ == '__main__':
    uvicorn.run('app.main:app', host='0.0.0.0', port=8000, reload=True)
