import time
import uuid
from typing import Optional, Callable, Any
from app.models.experiment import ExperimentResult
from app.models.solution import SolutionResult
from algorithms.exact.brute_force import solve_exact
from algorithms.mcts.mcts import solve_mcts

def run_single_experiment(
    graph, algorithm: str, strategy: str = 'random',
    time_limit: Optional[float] = None, iterations: Optional[int] = None,
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
        eff_time_limit = float(time_limit) if time_limit is not None else 30.0
        result = solve_exact(graph, time_limit=eff_time_limit, event_callback=event_callback)
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
            time_limit=int(eff_time_limit),
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
        if iterations is None or time_limit is None:
            from algorithms.mcts.budget import calibrate_mcts_budget
            budget = calibrate_mcts_budget(graph, strategy=strategy)
            eff_iterations = int(iterations) if iterations is not None else int(budget['iterations'])
            eff_time_limit = float(time_limit) if time_limit is not None else float(budget['time_limit'])
        else:
            eff_iterations = int(iterations)
            eff_time_limit = float(time_limit)

        result = solve_mcts(
            graph, 
            time_limit=eff_time_limit,
            iterations=eff_iterations,
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
            time_limit=int(eff_time_limit),
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
            time_limit=algo_cfg.get('time_limit', None),
            iterations=algo_cfg.get('iterations', None),
            exploration=algo_cfg.get('exploration', 1.414),
            seed=algo_cfg.get('seed', 42),
            event_callback=event_callback
        )
        results.append(res)
    return results
