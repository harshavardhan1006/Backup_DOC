import random
from typing import Tuple, Optional
from algorithms.mcts.state import WVCPState
from app.models.solution import Coloring

def random_simulation(state: WVCPState, coloring: Optional[Coloring] = None) -> Tuple[float, Coloring]:
    """Complete the coloring randomly and return WVCP score and coloring.
    
    Optimized:
      - Phase 2: uses marker array to detect neighbor colors in O(deg(v)).
      - Phase 3: accepts pre-materialized mutable coloring array to avoid redundant cloning.
    
    Preserves the exact random.choice(legal) call sequence and RNG consumption
    to produce identical results given the same seed.
    """
    graph = state.graph
    if coloring is not None:
        colors = coloring.colors
    else:
        colors = list(state.coloring.colors)
    weights = graph.weights
    adj = graph.adj
    vertex_order = state.vertex_order

    # Initialize max weights per color from current partial state
    max_weights: dict[int, int] = {}
    next_color_id = 0
    for v, c in enumerate(colors):
        if c >= 0:
            max_weights[c] = max(max_weights.get(c, 0), weights[v])
            if c >= next_color_id:
                next_color_id = c + 1

    # Pre-allocate marker array
    marker_capacity = max(next_color_id + 2, 32)
    neighbor_color_marker = [0] * marker_capacity
    vertex_stamp = 0

    # Color remaining vertices in predetermined order
    for idx in range(state.current_index, len(vertex_order)):
        v = vertex_order[idx]
        vertex_stamp += 1

        # Grow marker if needed
        if next_color_id + 1 >= marker_capacity:
            old_cap = marker_capacity
            marker_capacity = (next_color_id + 2) * 2
            neighbor_color_marker.extend([0] * (marker_capacity - old_cap))

        # Mark neighbor colors
        for n in adj[v]:
            nc = colors[n]
            if nc >= 0:
                neighbor_color_marker[nc] = vertex_stamp

        # Build legal list in same order as dict iteration (preserves RNG sequence)
        legal = []
        for c in max_weights:
            if neighbor_color_marker[c] != vertex_stamp:
                legal.append(c)
        legal.append(next_color_id)  # new color always at end

        # Identical random.choice call preserves RNG consumption sequence
        chosen = random.choice(legal)
        colors[v] = chosen
        if chosen in max_weights:
            if weights[v] > max_weights[chosen]:
                max_weights[chosen] = weights[v]
        else:
            max_weights[chosen] = weights[v]
            next_color_id = chosen + 1

    final_coloring = Coloring(graph.num_vertices)
    final_coloring.colors = colors
    score = float(sum(max_weights.values()))
    return score, final_coloring
