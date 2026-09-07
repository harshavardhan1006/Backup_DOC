import time
from typing import Callable, Optional, Dict, Any

from app.models.graph import Graph
from app.models.solution import Coloring
from algorithms.wvcp import wvcp_score, get_legal_colors
from app.models.events import EventType, AlgorithmEvent


class BruteForceResult:
    def __init__(self):
        self.best_score: float = float('inf')
        self.best_coloring: Optional[Dict[int, int]] = None  # vertex -> color mapping
        self.color_classes: Dict[int, list] = {}
        self.max_weights: Dict[int, float] = {}
        self.num_colors: int = 0
        self.states_explored: int = 0
        self.branches_pruned: int = 0
        self.status: str = 'RUNNING'  # OPTIMAL, TIMEOUT, STOPPED
        self.runtime: float = 0.0
        self.is_optimal: bool = False


def _send_event(callback: Optional[Callable], event_type: Any, **kwargs):
    """Helper to dispatch algorithm events if a callback is provided."""
    if callback:
        event = AlgorithmEvent(
            type=event_type,
            timestamp=time.time(),
            **kwargs
        )
        callback(event)


def solve_exact(
    graph: Graph,
    time_limit: float = 60.0,
    event_callback: Optional[Callable] = None,
    event_throttle: float = 0.05,
) -> BruteForceResult:
    """
    Solves the Weighted Vertex Coloring Problem (WVCP) exactly using branch-and-bound.
    
    Args:
        graph: The Graph object containing vertices, weights, and adjacency information.
        time_limit: Maximum execution time in seconds.
        event_callback: Callback function to receive real-time AlgorithmEvent updates.
        event_throttle: Minimum time in seconds between progress events.
        
    Returns:
        BruteForceResult containing the best found solution and search statistics.
    """
    result = BruteForceResult()
    start_time = time.time()
    last_event_time = start_time
    
    # 1. Sort vertices by weight descending (process heaviest first for better pruning)
    ordered_vertices = sorted(range(graph.num_vertices), key=lambda v: graph.weights[v], reverse=True)
    
    adj = graph.adj 
    weights = graph.weights
    num_vertices = graph.num_vertices
    
    # State arrays for fast lookup and backtracking
    colors = [-1] * num_vertices
    max_weights_per_color = [0.0] * num_vertices
    
    _send_event(event_callback, EventType.SEARCH_STARTED, message="Starting exact search (Branch & Bound)")

    def backtrack(vertex_idx: int, current_num_colors: int, current_score: float):
        nonlocal last_event_time
        
        # Check timeout
        if time.time() - start_time > time_limit:
            result.status = 'TIMEOUT'
            return
            
        result.states_explored += 1
        
        # Throttle periodic progress events
        curr_time = time.time()
        if curr_time - last_event_time >= event_throttle:
            _send_event(
                event_callback, 
                EventType.SEARCH_PROGRESS,
                states_explored=result.states_explored,
                branches_pruned=result.branches_pruned,
                best_score=result.best_score if result.best_score != float('inf') else None,
                current_score=current_score,
                depth=vertex_idx,
                total_depth=num_vertices
            )
            last_event_time = curr_time

        # Base case: All vertices colored
        if vertex_idx == num_vertices:
            if current_score < result.best_score:
                result.best_score = current_score
                result.best_coloring = {str(v): colors[v] for v in range(num_vertices)}
                result.num_colors = current_num_colors
                
                # Compute classes and max weights for the result mapping
                class_dict = {}
                weight_dict = {}
                for v in range(num_vertices):
                    c = colors[v]
                    if c not in class_dict:
                        class_dict[c] = []
                    class_dict[c].append(v)
                    weight_dict[c] = max(weight_dict.get(c, 0.0), weights[v])
                result.color_classes = class_dict
                result.max_weights = weight_dict
                
                _send_event(
                    event_callback,
                    EventType.BEST_SOLUTION_UPDATED,
                    score=result.best_score,
                    num_colors=result.num_colors,
                    coloring=result.best_coloring.copy()
                )
            return
            
        # Pruning check (Bound pruning)
        if current_score >= result.best_score:
            result.branches_pruned += 1
            ct = time.time()
            if ct - last_event_time >= event_throttle:
                _send_event(
                    event_callback, 
                    EventType.BRANCH_PRUNED, 
                    depth=vertex_idx, 
                    current_score=current_score, 
                    best_score=result.best_score
                )
                last_event_time = ct
            return
            
        v = ordered_vertices[vertex_idx]
        v_weight = weights[v]
        v_adj = adj[v]
        
        # Determine legal colors by checking neighbors
        used_neighbor_colors = set()
        for neighbor in v_adj:
            if colors[neighbor] != -1:
                used_neighbor_colors.add(colors[neighbor])
                
        # Try all existing colors plus one new color to prevent redundant color permutations
        max_color_to_try = current_num_colors + 1
        
        for c in range(max_color_to_try):
            # Adjacency constraint check
            if c in used_neighbor_colors:
                continue
                
            is_new_color = (c == current_num_colors)
            
            # Apply color
            colors[v] = c
            old_max_weight = max_weights_per_color[c]
            new_max_weight = max(old_max_weight, v_weight)
            max_weights_per_color[c] = new_max_weight
            
            # Fast score update
            new_score = current_score - old_max_weight + new_max_weight
            
            # Color assignment event (throttled)
            ct = time.time()
            if ct - last_event_time >= event_throttle:
                _send_event(
                    event_callback,
                    EventType.COLOR_ASSIGNED,
                    vertex=v,
                    color=c,
                    current_score=new_score,
                    depth=vertex_idx
                )
                last_event_time = ct
            
            # Recurse
            backtrack(
                vertex_idx + 1, 
                current_num_colors + 1 if is_new_color else current_num_colors,
                new_score
            )
            
            # Backtrack
            colors[v] = -1
            max_weights_per_color[c] = old_max_weight
            
            # Halt further exploration if timeout propagated up
            if result.status == 'TIMEOUT':
                return

    # Start recursive search
    backtrack(0, 0, 0.0)
    
    result.runtime = time.time() - start_time
    
    # Mark optimum if we finished without hitting the timeout
    if result.status != 'TIMEOUT':
        result.status = 'OPTIMAL'
        result.is_optimal = True
        
    final_event_type = EventType.SEARCH_COMPLETED if result.status == 'OPTIMAL' else EventType.SEARCH_TIMEOUT
    _send_event(
        event_callback,
        final_event_type,
        best_score=result.best_score if result.best_score != float('inf') else None,
        runtime=result.runtime,
        states_explored=result.states_explored,
        branches_pruned=result.branches_pruned,
        is_optimal=result.is_optimal
    )
    
    return result
