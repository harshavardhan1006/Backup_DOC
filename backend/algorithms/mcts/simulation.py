from typing import Tuple
from algorithms.mcts.state import WVCPState
from app.models.solution import Coloring

def simulate(state: WVCPState, strategy: str = 'random') -> Tuple[float, Coloring]:
    """Run a simulation from the given state and return the WVCP score and coloring.
    
    Materializes the mutable coloring array exactly once at rollout entry,
    avoiding redundant O(V) allocations per tree node.
    """
    materialized = state.materialize_coloring() if hasattr(state, 'materialize_coloring') else state.coloring

    if strategy == 'random':
        from algorithms.mcts.strategies.random_strategy import random_simulation
        return random_simulation(state, coloring=materialized)
    elif strategy == 'greedy':
        from algorithms.mcts.strategies.greedy import greedy_simulation
        return greedy_simulation(state, coloring=materialized)
    elif strategy == 'dsatur':
        from algorithms.mcts.strategies.dsatur import dsatur_simulation
        return dsatur_simulation(state, coloring=materialized)
    else:
        from algorithms.mcts.strategies.random_strategy import random_simulation
        return random_simulation(state, coloring=materialized)
