from app.models.experiment import ExperimentResult
from app.services.graph_service import GraphService
from app.services.solver_service import SolverService
from experiments.runner import run_comparison, run_single_experiment
from experiments.benchmark import run_scalability_experiment
from experiments.metrics import export_results_csv, export_results_json

class ExperimentService:
    def __init__(self, graph_service: GraphService, solver_service: SolverService):
        self.graph_service = graph_service
        self.solver_service = solver_service
        self.results: list[ExperimentResult] = []
    
    async def run_experiment(self, config, event_callback) -> list[ExperimentResult]:
        graph = self.graph_service.get_graph(config.graph_id)
        if not graph:
            raise ValueError(f"Graph {config.graph_id} not found")
            
        algorithms_cfg = config.algorithms if hasattr(config, 'algorithms') else [{'algorithm': 'mcts'}]
        
        # For simplicity, running synchronously here since it's an orchestration wrapper
        # In full production, this would use executors
        res = run_comparison(graph, algorithms_cfg, event_callback)
        self.results.extend(res)
        return res
        
    async def run_scalability(self, config, event_callback) -> list[ExperimentResult]:
        res = run_scalability_experiment(
            graph_sizes=getattr(config, 'graph_sizes', [5, 10, 15]),
            algorithms=getattr(config, 'algorithms', [{'algorithm': 'mcts', 'strategy': 'dsatur'}]),
            time_limit=getattr(config, 'time_limit', 10.0),
            iterations=getattr(config, 'iterations', 500),
            edge_probability=getattr(config, 'edge_probability', 0.3),
            min_weight=getattr(config, 'min_weight', 1),
            max_weight=getattr(config, 'max_weight', 100),
            num_repetitions=getattr(config, 'num_repetitions', 1),
            seed=getattr(config, 'seed', 42),
            progress_callback=event_callback
        )
        self.results.extend(res)
        return res
        
    def get_results(self) -> list[ExperimentResult]:
        return self.results
        
    def clear_results(self):
        self.results = []
        
    def export_csv(self, filepath: str):
        export_results_csv(self.results, filepath)
        
    def export_json(self, filepath: str):
        export_results_json(self.results, filepath)
