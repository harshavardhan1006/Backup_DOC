from typing import Tuple, Optional
from algorithms.mcts.state import WVCPState
from app.models.solution import Coloring


def greedy_simulation(state: WVCPState, coloring: Optional[Coloring] = None) -> Tuple[float, Coloring]:
    """Complete the coloring greedily, minimizing marginal WVCP score increase.
    
    Optimized:
      - Phase 2: uses marker array to detect neighbor colors in O(deg(v)).
      - Phase 3: accepts pre-materialized mutable coloring array to avoid redundant cloning.
      - Hotpath: O(d log d) prefix scan, pre-bound dict_items view, and in-place Coloring reuse.
    
    Produces identical color assignments and scores as the original implementation.
    """
    graph = state.graph
    if coloring is not None:
        colors = coloring.colors
        final_coloring = coloring
    else:
        colors = list(state.coloring.colors)
        final_coloring = Coloring(graph.num_vertices, colors)

    weights = graph.weights
    adj = graph.adj
    vertex_order = state.vertex_order
    cur_idx = state.current_index

    max_weights: dict[int, int] = {}
    next_color_id = 0

    if getattr(state, '_initial_coloring', None) is None:
        if cur_idx == 1:
            v0 = vertex_order[0]
            c0 = colors[v0]
            if c0 >= 0:
                max_weights[c0] = weights[v0]
                next_color_id = c0 + 1
        elif cur_idx > 1:
            for v in sorted(vertex_order[:cur_idx]):
                c = colors[v]
                if c >= 0:
                    w_v = weights[v]
                    if w_v > max_weights.get(c, 0):
                        max_weights[c] = w_v
                    if c >= next_color_id:
                        next_color_id = c + 1
    else:
        for v, c in enumerate(colors):
            if c >= 0:
                max_weights[c] = max(max_weights.get(c, 0), weights[v])
                if c >= next_color_id:
                    next_color_id = c + 1

    # Pre-allocate marker array
    marker_capacity = max(next_color_id + 2, 32)
    neighbor_color_marker = [0] * marker_capacity
    mw_items = max_weights.items()
    vertex_stamp = 0
    inf = float('inf')

    remaining = vertex_order if cur_idx == 0 else vertex_order[cur_idx:]
    for v in remaining:
        w = weights[v]
        vertex_stamp += 1

        # Mark neighbor colors
        for n in adj[v]:
            nc = colors[n]
            if nc >= 0:
                neighbor_color_marker[nc] = vertex_stamp

        # Evaluate existing colors in dict insertion order (preserves tie-breaking)
        best_c = -1
        best_increase = inf

        for c, current_max in mw_items:
            if neighbor_color_marker[c] == vertex_stamp:
                continue

            increase = 0 if current_max >= w else w - current_max
            if increase < best_increase:
                best_increase = increase
                best_c = c
                if increase == 0:
                    break  # Cannot beat 0 marginal increase

        # Evaluate new color (increase = w, from max 0)
        if best_c == -1 or w < best_increase:
            best_c = next_color_id
            colors[v] = best_c
            max_weights[best_c] = w
            next_color_id = best_c + 1
            if next_color_id + 1 >= marker_capacity:
                neighbor_color_marker.extend([0] * marker_capacity)
                marker_capacity *= 2
        else:
            colors[v] = best_c
            if w > max_weights[best_c]:
                max_weights[best_c] = w

    score = float(sum(max_weights.values()))
    return score, final_coloring
