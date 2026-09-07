from typing import Tuple
from algorithms.mcts.state import WVCPState
from app.models.solution import Coloring

def dsatur_simulation(state: WVCPState) -> Tuple[float, Coloring]:
    """
    DSatur-inspired simulation.
    Chooses legal colors balancing marginal WVCP weight increase with neighborhood saturation.
    """
    graph = state.graph
    colors = list(state.coloring.colors)
    
    max_weights: dict[int, int] = {}
    class_sizes: dict[int, int] = {}
    for v, c in enumerate(colors):
        if c >= 0:
            max_weights[c] = max(max_weights.get(c, 0), graph.weights[v])
            class_sizes[c] = class_sizes.get(c, 0) + 1
            
    for idx in range(state.current_index, len(state.vertex_order)):
        v = state.vertex_order[idx]
        w = graph.weights[v]
        used_neighbor_colors = {colors[n] for n in graph.neighbors(v) if colors[n] >= 0}
        
        legal = [c for c in max_weights if c not in used_neighbor_colors]
        next_new = max(max_weights.keys()) + 1 if max_weights else 0
        legal.append(next_new)
        
        best_c = legal[0]
        best_heuristic = float('inf')
        
        for c in legal:
            current_max = max_weights.get(c, 0)
            new_max = max(current_max, w)
            increase = new_max - current_max
            
            # Prefer larger existing classes (saturation bonus) over creating new classes
            class_size = class_sizes.get(c, 0)
            saturation_bonus = -0.1 * class_size if class_size > 0 else 1.0
            combined = increase + saturation_bonus
            
            if combined < best_heuristic:
                best_heuristic = combined
                best_c = c
                
        colors[v] = best_c
        max_weights[best_c] = max(max_weights.get(best_c, 0), w)
        class_sizes[best_c] = class_sizes.get(best_c, 0) + 1
        
    final_coloring = Coloring(graph.num_vertices)
    final_coloring.colors = colors
    score = float(sum(max_weights.values()))
    return score, final_coloring
