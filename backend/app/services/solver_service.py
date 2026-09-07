import asyncio
import time
from typing import Optional, Callable
from app.models.solution import SolutionResult, AlgorithmConfig
from app.services.graph_service import GraphService
from algorithms.exact.brute_force import solve_exact
from algorithms.mcts.mcts import solve_mcts

class SolverService:
    def __init__(self, graph_service: GraphService):
        self.graph_service = graph_service
        self.active_runs: dict = {}  # track running solvers
    
    async def run_exact(self, graph_id: str, config: any, event_callback) -> any:
        graph = self.graph_service.get_graph(graph_id)
        if not graph:
            raise ValueError(f"Graph '{graph_id}' not found")
            
        run_id = f"exact_{time.time()}"
        self.active_runs[run_id] = True
        
        loop = asyncio.get_running_loop()
        time_limit = float(getattr(config, 'time_limit', 30.0))
        
        import functools
        fn = functools.partial(
            solve_exact,
            graph=graph,
            time_limit=time_limit,
            event_callback=event_callback
        )
        
        try:
            result = await loop.run_in_executor(None, fn)
            return result
        finally:
            self.active_runs.pop(run_id, None)
        
    async def run_mcts(self, graph_id: str, config: any, event_callback) -> any:
        graph = self.graph_service.get_graph(graph_id)
        if not graph:
            raise ValueError(f"Graph '{graph_id}' not found")
            
        run_id = f"mcts_{time.time()}"
        self.active_runs[run_id] = True
        
        loop = asyncio.get_running_loop()
        max_iters = int(getattr(config, 'iterations', getattr(config, 'max_iterations', 1000)))
        time_limit = float(getattr(config, 'time_limit', 30.0))
        expl_weight = float(getattr(config, 'exploration', getattr(config, 'exploration_coeff', getattr(config, 'exploration_weight', 1.414))))
        strategy = str(getattr(config, 'strategy', getattr(config, 'simulation_strategy', 'dsatur'))).lower()
        seed = int(getattr(config, 'seed', getattr(config, 'random_seed', 42)))
        
        import functools
        fn = functools.partial(
            solve_mcts,
            graph=graph,
            iterations=max_iters,
            time_limit=time_limit,
            exploration=expl_weight,
            strategy=strategy,
            seed=seed,
            event_callback=event_callback
        )
        
        try:
            result = await loop.run_in_executor(None, fn)
            return result
        finally:
            self.active_runs.pop(run_id, None)
        
    async def run_comparison(self, graph_id: str, configs: list, event_callback) -> list:
        results = []
        for config in configs:
            algo = getattr(config, 'algorithm', getattr(config, 'algorithm_type', 'mcts'))
            if algo == 'exact':
                res = await self.run_exact(graph_id, config, event_callback)
            else:
                res = await self.run_mcts(graph_id, config, event_callback)
            results.append(res)
        return results
