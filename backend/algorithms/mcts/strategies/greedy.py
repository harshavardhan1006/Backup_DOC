from typing import Tuple
from algorithms.mcts.state import WVCPState
from app.models.solution import Coloring

def greedy_simulation(state: WVCPState) -> Tuple[float, Coloring]:
    """Complete the coloring greedily, minimizing marginal WVCP score increase."""
    graph = state.graph
    colors = list(state.coloring.colors)
    
    max_weights: dict[int, int] = {}
    for v, c in enumerate(colors):
        if c >= 0:
            max_weights[c] = max(max_weights.get(c, 0), graph.weights[v])
            
    for idx in range(state.current_index, len(state.vertex_order)):
        v = state.vertex_order[idx]
        w = graph.weights[v]
        used_neighbor_colors = {colors[n] for n in graph.neighbors(v) if colors[n] >= 0}
        
        legal = [c for c in max_weights if c not in used_neighbor_colors]
        next_new = max(max_weights.keys()) + 1 if max_weights else 0
        legal.append(next_new)
        
        best_c = legal[0]
        best_increase = float('inf')
        
        for c in legal:
            current_max = max_weights.get(c, 0)
            new_max = max(current_max, w)
            increase = new_max - current_max
            if increase < best_increase:
                best_increase = increase
                best_c = c
                
        colors[v] = best_c
        max_weights[best_c] = max(max_weights.get(best_c, 0), w)
        
    final_coloring = Coloring(graph.num_vertices)
    final_coloring.colors = colors
    score = float(sum(max_weights.values()))
    return score, final_coloring
