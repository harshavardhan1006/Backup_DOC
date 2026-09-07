from typing import Tuple
from algorithms.mcts.state import WVCPState
from app.models.solution import Coloring

def simulate(state: WVCPState, strategy: str = 'random') -> Tuple[float, Coloring]:
    """Run a simulation from the given state and return the WVCP score and coloring."""
    if strategy == 'random':
        from algorithms.mcts.strategies.random_strategy import random_simulation
        return random_simulation(state)
    elif strategy == 'greedy':
        from algorithms.mcts.strategies.greedy import greedy_simulation
        return greedy_simulation(state)
    elif strategy == 'dsatur':
        from algorithms.mcts.strategies.dsatur import dsatur_simulation
        return dsatur_simulation(state)
    else:
        from algorithms.mcts.strategies.random_strategy import random_simulation
        return random_simulation(state)
