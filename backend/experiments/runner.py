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
    density = (
        round((2.0 * graph.num_edges()) / (graph.num_vertices * (graph.num_vertices - 1)), 4)
        if graph.num_vertices > 1
        else 0.0
    )
    
    if algorithm == 'exact':
        result = solve_exact(graph, time_limit=time_limit, event_callback=event_callback)
        return ExperimentResult(
            experiment_id=str(uuid.uuid4()),
            timestamp=time.time(),
            graph_id=getattr(graph, 'id', 'unknown'),
            graph_size=graph.num_vertices,
            edge_count=graph.num_edges(),
            density=density,
            algorithm='exact',
            simulation_strategy='none',
            iterations=result.states_explored,
            time_limit=int(time_limit),
            exploration_coeff=0.0,
            seed=seed,
            runtime=result.runtime,
            status=result.status,
            score=result.best_score if result.best_score != float('inf') else 0.0,
            num_colors=result.num_colors,
            nodes_explored=result.states_explored,
            nodes_pruned=result.branches_pruned,
            simulations=0,
            optimality_gap=0.0,
            speedup=1.0,
        )
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
        return ExperimentResult(
            experiment_id=str(uuid.uuid4()),
            timestamp=time.time(),
            graph_id=getattr(graph, 'id', 'unknown'),
            graph_size=graph.num_vertices,
            edge_count=graph.num_edges(),
            density=density,
            algorithm='mcts',
            simulation_strategy=strategy,
            iterations=result.iterations,
            time_limit=int(time_limit),
            exploration_coeff=float(exploration),
            seed=seed,
            runtime=result.runtime,
            status=result.status,
            score=result.best_score if result.best_score != float('inf') else 0.0,
            num_colors=result.num_colors,
            nodes_explored=result.nodes_explored,
            nodes_pruned=getattr(result, 'nodes_pruned', 0),
            simulations=getattr(result, 'simulations', 0),
            optimality_gap=None,
            speedup=None,
        )
    else:
        raise ValueError(f"Unknown algorithm: {algorithm}")

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
