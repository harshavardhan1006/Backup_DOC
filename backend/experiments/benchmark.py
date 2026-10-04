from app.models.experiment import ExperimentResult
from datasets.generator import generate_random_graph
from experiments.runner import run_single_experiment

def run_scalability_experiment(
    graph_sizes: list[int],
    algorithms: list[dict],
    edge_probability: float = 0.3,
    min_weight: int = 1,
    max_weight: int = 100,
    time_limit: float = None,
    iterations: int = None,
    num_repetitions: int = 1,
    seed: int = 42,
    progress_callback=None,
) -> list[ExperimentResult]:
    """Run scalability experiments across different graph sizes."""
    results = []
    total_runs = len(graph_sizes) * len(algorithms) * num_repetitions
    current_run = 0
    
    for size in graph_sizes:
        for rep in range(num_repetitions):
            graph = generate_random_graph(
                size, edge_probability, min_weight, max_weight, seed + rep
            )
            for algo_cfg in algorithms:
                res = run_single_experiment(
                    graph,
                    algorithm=algo_cfg.get('algorithm', 'mcts'),
                    strategy=algo_cfg.get('strategy', 'random'),
                    time_limit=time_limit,
                    iterations=iterations,
                    exploration=algo_cfg.get('exploration', 1.414),
                    seed=seed + rep
                )
                res.graph_id = f"scale_{size}_{rep}"
                results.append(res)
                
                current_run += 1
                if progress_callback:
                    progress_callback(current_run / total_runs)
                    
    return results
