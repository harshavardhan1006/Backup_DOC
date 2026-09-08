from typing import Tuple, Optional
from algorithms.mcts.state import WVCPState
from app.models.solution import Coloring

def dsatur_simulation(state: WVCPState, coloring: Optional[Coloring] = None) -> Tuple[float, Coloring]:
    """
    DSatur-inspired simulation.
    Chooses legal colors balancing marginal WVCP weight increase with neighborhood saturation.
    
    Optimized:
      - Phase 2: marker array detects neighbor colors in O(deg(v)) with zero set allocations.
      - Phase 3: accepts pre-materialized mutable coloring array to avoid redundant cloning.
    
    Produces identical color assignments and scores as the original implementation.
    """
    graph = state.graph
    if coloring is not None:
        colors = coloring.colors
    else:
        colors = list(state.coloring.colors)
    weights = graph.weights
    adj = graph.adj
    vertex_order = state.vertex_order

    max_weights: dict[int, int] = {}
    class_sizes: dict[int, int] = {}
    next_color_id = 0
    for v, c in enumerate(colors):
        if c >= 0:
            max_weights[c] = max(max_weights.get(c, 0), weights[v])
            class_sizes[c] = class_sizes.get(c, 0) + 1
            if c >= next_color_id:
                next_color_id = c + 1

    # Pre-allocate marker array for neighbor color detection.
    # neighbor_color_marker[c] == vertex_stamp means color c is used by a neighbor.
    marker_capacity = max(next_color_id + 2, 32)
    neighbor_color_marker = [0] * marker_capacity
    vertex_stamp = 0

    for idx in range(state.current_index, len(vertex_order)):
        v = vertex_order[idx]
        w = weights[v]
        vertex_stamp += 1

        # Grow marker array if needed (rare: only when a new color exceeds capacity)
        if next_color_id + 1 >= marker_capacity:
            old_cap = marker_capacity
            marker_capacity = (next_color_id + 2) * 2
            neighbor_color_marker.extend([0] * (marker_capacity - old_cap))

        # Mark neighbor colors — replaces set allocation {colors[n] for n in ...}
        for n in adj[v]:
            nc = colors[n]
            if nc >= 0:
                neighbor_color_marker[nc] = vertex_stamp

        # Evaluate existing colors in dict insertion order (preserves tie-breaking)
        best_c = -1
        best_heuristic = float('inf')

        for c in max_weights:
            if neighbor_color_marker[c] == vertex_stamp:
                continue  # color c conflicts with a neighbor

            current_max = max_weights[c]
            new_max = current_max if current_max >= w else w
            increase = new_max - current_max

            # Existing classes always have class_size > 0
            class_size = class_sizes[c]
            saturation_bonus = -0.1 * class_size
            combined = increase + saturation_bonus

            if combined < best_heuristic:
                best_heuristic = combined
                best_c = c

        # Evaluate new color (class_size == 0 -> saturation_bonus = 1.0)
        combined_new = w + 1.0
        if best_c == -1:
            # No legal existing colors; must use new color
            best_c = next_color_id
        elif combined_new < best_heuristic:
            best_c = next_color_id

        # Apply assignment
        colors[v] = best_c
        if best_c in max_weights:
            if w > max_weights[best_c]:
                max_weights[best_c] = w
            class_sizes[best_c] += 1
        else:
            max_weights[best_c] = w
            class_sizes[best_c] = 1
            next_color_id = best_c + 1

    final_coloring = Coloring(graph.num_vertices)
    final_coloring.colors = colors
    score = float(sum(max_weights.values()))
    return score, final_coloring
