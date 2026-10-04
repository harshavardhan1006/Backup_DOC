from typing import Tuple
from algorithms.mcts.state import WVCPState
from app.models.solution import Coloring
from algorithms.mcts.strategies.random_strategy import random_simulation
from algorithms.mcts.strategies.greedy import greedy_simulation
from algorithms.mcts.strategies.dsatur import dsatur_simulation


def simulate(state: WVCPState, strategy: str = 'random') -> Tuple[float, Coloring]:
    """Run a simulation from the given state and return the WVCP score and coloring.
    
    Materializes the mutable coloring array exactly once at rollout entry,
    avoiding redundant O(V) allocations per tree node.
    """
    materialized = state.materialize_coloring() if hasattr(state, 'materialize_coloring') else state.coloring

    if strategy == 'dsatur':
        return dsatur_simulation(state, coloring=materialized)
    elif strategy == 'greedy':
        return greedy_simulation(state, coloring=materialized)
    else:
        return random_simulation(state, coloring=materialized)
