import random
from typing import Tuple
from algorithms.mcts.state import WVCPState
from app.models.solution import Coloring

def random_simulation(state: WVCPState) -> Tuple[float, Coloring]:
    """Complete the coloring randomly and return WVCP score and coloring."""
    graph = state.graph
    colors = list(state.coloring.colors)
    
    # Initialize max weights per color from current partial state
    max_weights: dict[int, int] = {}
    for v, c in enumerate(colors):
        if c >= 0:
            max_weights[c] = max(max_weights.get(c, 0), graph.weights[v])
            
    # Color remaining vertices in predetermined order
    for idx in range(state.current_index, len(state.vertex_order)):
        v = state.vertex_order[idx]
        used_neighbor_colors = {colors[n] for n in graph.neighbors(v) if colors[n] >= 0}
        
        # Legal colors: existing valid colors + one new color
        legal = [c for c in max_weights if c not in used_neighbor_colors]
        next_new = max(max_weights.keys()) + 1 if max_weights else 0
        legal.append(next_new)
        
        chosen = random.choice(legal)
        colors[v] = chosen
        max_weights[chosen] = max(max_weights.get(chosen, 0), graph.weights[v])
        
    final_coloring = Coloring(graph.num_vertices)
    final_coloring.colors = colors
    score = float(sum(max_weights.values()))
    return score, final_coloring
