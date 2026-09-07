import time
import uuid
from typing import Optional, Callable, Any
from app.models.experiment import ExperimentResult
from app.models.solution import SolutionResult
from algorithms.exact.brute_force import solve_exact
from algorithms.mcts.mcts import solve_mcts

def run_single_experiment(
    graph, algorithm: str, strategy: str = 'random',
    time_limit: float = 60, iterations: int = 1000,
    exploration: float = 1.414, seed: int = 42,
    event_callback: Optional[Callable] = None,
) -> ExperimentResult:
    """Run a single algorithm on a graph and return results."""
    start_time = time.time()
    
    # Adapt to solver inputs
    if algorithm == 'exact':
        result = solve_exact(graph, time_limit=time_limit, event_callback=event_callback)
    elif algorithm == 'mcts':
        result = solve_mcts(
            graph, 
            time_limit=time_limit,
            iterations=iterations,
            exploration=exploration,
            strategy=strategy,
            seed=seed,
            event_callback=event_callback
        )
    else:
        raise ValueError(f"Unknown algorithm: {algorithm}")
        
    execution_time = time.time() - start_time
    
    metrics = {}
    if algorithm == 'exact':
        metrics['states_explored'] = result.states_explored
        metrics['branches_pruned'] = result.branches_pruned
    elif algorithm == 'mcts':
        metrics['iterations'] = result.iterations
        metrics['nodes_explored'] = result.nodes_explored
        metrics['nodes_pruned'] = getattr(result, 'nodes_pruned', 0)
        metrics['simulations'] = getattr(result, 'simulations', 0)
    
    exp_res = ExperimentResult(
        experiment_id=str(uuid.uuid4()),
        graph_id="unknown", # caller can fill this
        algorithm=algorithm,
        score=result.best_score,
        execution_time=execution_time,
        status=result.status,
        parameters={
            "strategy": strategy,
            "time_limit": time_limit,
            "iterations": iterations,
            "exploration": exploration,
            "seed": seed
        }
    )
    # Assume we can attach metrics dynamically if we want, or just return
    # If ExperimentResult doesn't have metrics, we can add it or just ignore.
    if hasattr(exp_res, 'metrics'):
        exp_res.metrics = metrics
        
    return exp_res

def run_comparison(
    graph, algorithms: list[dict],
    event_callback: Optional[Callable] = None,
) -> list[ExperimentResult]:
    """Run multiple algorithms on the same graph for comparison."""
    results = []
    for algo_cfg in algorithms:
        res = run_single_experiment(
            graph,
            algorithm=algo_cfg.get('algorithm', 'mcts'),
            strategy=algo_cfg.get('strategy', 'random'),
            time_limit=algo_cfg.get('time_limit', 60),
            iterations=algo_cfg.get('iterations', 1000),
            exploration=algo_cfg.get('exploration', 1.414),
            seed=algo_cfg.get('seed', 42),
            event_callback=event_callback
        )
        results.append(res)
    return results
