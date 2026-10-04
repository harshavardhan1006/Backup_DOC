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
      - Hotpath: O(d log d) prefix scan instead of O(V), pre-bound dict_items view,
        and pre-allocated saturation bonus array.
    
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
    class_sizes: dict[int, int] = {}
    next_color_id = 0

    if getattr(state, '_initial_coloring', None) is None:
        if cur_idx == 1:
            v0 = vertex_order[0]
            c0 = colors[v0]
            if c0 >= 0:
                max_weights[c0] = weights[v0]
                class_sizes[c0] = 1
                next_color_id = c0 + 1
        elif cur_idx > 1:
            for v in sorted(vertex_order[:cur_idx]):
                c = colors[v]
                if c >= 0:
                    w_v = weights[v]
                    if w_v > max_weights.get(c, 0):
                        max_weights[c] = w_v
                    class_sizes[c] = class_sizes.get(c, 0) + 1
                    if c >= next_color_id:
                        next_color_id = c + 1
    else:
        for v, c in enumerate(colors):
            if c >= 0:
                max_weights[c] = max(max_weights.get(c, 0), weights[v])
                class_sizes[c] = class_sizes.get(c, 0) + 1
                if c >= next_color_id:
                    next_color_id = c + 1

    # Pre-allocate marker and saturation bonus arrays
    marker_capacity = max(next_color_id + 2, 32)
    neighbor_color_marker = [0] * marker_capacity
    cs_arr = [0] * marker_capacity
    bon_arr = [0.0] * marker_capacity
    for c, sz in class_sizes.items():
        cs_arr[c] = sz
        bon_arr[c] = -0.1 * sz

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
        best_heuristic = inf

        for c, current_max in mw_items:
            if neighbor_color_marker[c] == vertex_stamp:
                continue

            combined = bon_arr[c] if current_max >= w else (w - current_max) + bon_arr[c]
            if combined < best_heuristic:
                best_heuristic = combined
                best_c = c

        # Evaluate new color (class_size == 0 -> saturation_bonus = 1.0)
        if best_c == -1 or (w + 1.0) < best_heuristic:
            best_c = next_color_id
            colors[v] = best_c
            max_weights[best_c] = w
            cs_arr[best_c] = 1
            bon_arr[best_c] = -0.1
            next_color_id = best_c + 1
            if next_color_id + 1 >= marker_capacity:
                ext = [0] * marker_capacity
                neighbor_color_marker.extend(ext)
                cs_arr.extend(ext)
                bon_arr.extend([0.0] * marker_capacity)
                marker_capacity *= 2
        else:
            colors[v] = best_c
            if w > max_weights[best_c]:
                max_weights[best_c] = w
            sz = cs_arr[best_c] + 1
            cs_arr[best_c] = sz
            bon_arr[best_c] = -0.1 * sz

    score = float(sum(max_weights.values()))
    return score, final_coloring
