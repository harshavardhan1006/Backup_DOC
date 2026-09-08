import random
import time
from typing import Callable, Optional
from app.models.graph import Graph
from app.models.solution import Coloring
from algorithms.wvcp import wvcp_score, is_valid_coloring
from app.models.events import EventType, AlgorithmEvent
from algorithms.mcts.state import WVCPState
from algorithms.mcts.node import MCTSNode
from algorithms.mcts.selection import select
from algorithms.mcts.expansion import expand
from algorithms.mcts.simulation import simulate
from algorithms.mcts.backpropagation import backpropagate
from algorithms.mcts.pruning import prune_on_improvement

class MCTSResult:
    def __init__(self):
        self.best_score: float = float('inf')
        self.best_coloring: Optional[dict] = None
        self.color_classes: dict = {}
        self.max_weights: dict = {}
        self.num_colors: int = 0
        self.iterations: int = 0
        self.nodes_created: int = 0
        self.nodes_explored: int = 0
        self.nodes_pruned: int = 0
        self.simulations: int = 0
        self.status: str = 'RUNNING'
        self.runtime: float = 0.0
        self.is_optimal: bool = False
        self.score_history: list = []

def solve_mcts(
    graph: Graph,
    iterations: int = 1000,
    time_limit: float = 30.0,
    exploration: float = 1.414,
    strategy: str = 'dsatur',
    seed: int = 42,
    event_callback: Optional[Callable] = None,
    event_throttle: float = 0.05,
) -> MCTSResult:
    random.seed(seed)
    MCTSNode._next_id = 0
    start_time = time.time()
    
    result = MCTSResult()
    
    if event_callback:
        event_callback(AlgorithmEvent(
            type=EventType.SEARCH_STARTED,
            timestamp=time.time(),
            message=f"MCTS search started with strategy={strategy}, iterations={iterations}"
        ))
    
    initial_state = WVCPState(graph)
    root = MCTSNode(initial_state)
    
    last_event_time = start_time
    last_progress_time = start_time
    
    def send_throttled_event(event_type: EventType, message: str = "", **kwargs):
        nonlocal last_event_time
        current_time = time.time()
        if current_time - last_event_time >= event_throttle:
            if event_callback:
                event_callback(AlgorithmEvent(type=event_type, timestamp=time.time(), message=message, **kwargs))
            last_event_time = current_time

    progress_step = max(1, iterations // 50)  # Every 2% or every 100ms
    
    for i in range(iterations):
        elapsed = time.time() - start_time
        if elapsed >= time_limit:
            result.status = 'TIMEOUT'
            result.iterations = i
            result.runtime = elapsed
            if event_callback:
                event_callback(AlgorithmEvent(
                    type=EventType.SEARCH_TIMEOUT,
                    timestamp=time.time(),
                    message=f"Time limit reached ({time_limit}s) at iteration {i}",
                    iteration=i,
                    best_score=result.best_score if result.best_score < float('inf') else None,
                    runtime=elapsed,
                    nodes_explored=result.nodes_explored,
                    nodes_pruned=result.nodes_pruned,
                    simulations=result.simulations
                ))
            break
            
        send_throttled_event(EventType.ITERATION_STARTED, iteration=i)
        
        # 1. Selection (with incremental pruning)
        leaf, sel_pruned = select(root, exploration, result.best_score)
        result.nodes_explored += 1
        result.nodes_pruned += sel_pruned
        send_throttled_event(EventType.NODE_SELECTED, node_id=leaf.id)
        
        # 2. Expansion
        if not leaf.is_terminal():
            expanded = expand(leaf)
            send_throttled_event(EventType.NODE_EXPANDED, node_id=expanded.id)
        else:
            expanded = leaf
            
        # 3. Simulation
        send_throttled_event(EventType.SIMULATION_STARTED, node_id=expanded.id)
        sim_score, sim_coloring = simulate(expanded.state, strategy)
        result.simulations += 1
        send_throttled_event(EventType.SIMULATION_COMPLETED, node_id=expanded.id, score=sim_score)
        
        # 4. Backpropagation
        backpropagate(expanded, sim_score)
        send_throttled_event(EventType.BACKPROPAGATION, node_id=expanded.id, score=sim_score)
        
        # 5. Check New Best Solution
        if sim_score < result.best_score and is_valid_coloring(graph, sim_coloring):
            result.best_score = sim_score
            best_dict = {str(v): c for v, c in enumerate(sim_coloring.colors)}
            result.best_coloring = best_dict
            result.color_classes = sim_coloring.get_color_classes()
            
            color_classes = result.color_classes
            max_weights = {}
            for c, verts in color_classes.items():
                max_weights[c] = max(graph.weights[v] for v in verts)
            result.max_weights = max_weights
            
            result.num_colors = sim_coloring.num_colors_used()
            result.score_history.append((i, sim_score))

            # 6. Prune on improvement (replaces per-iteration global O(T*V) DFS)
            improvement_pruned = prune_on_improvement(root, result.best_score)
            result.nodes_pruned += improvement_pruned
            if improvement_pruned:
                send_throttled_event(EventType.NODE_PRUNED, message=f"Pruned {improvement_pruned} subtrees", pruned_count=improvement_pruned)
            
            if event_callback:
                event_callback(AlgorithmEvent(
                    type=EventType.NEW_BEST_SOLUTION,
                    timestamp=time.time(),
                    message=f"New best WVCP score: {sim_score:.1f} with {result.num_colors} colors",
                    score=sim_score,
                    best_score=sim_score,
                    iteration=i,
                    num_colors=result.num_colors,
                    coloring=best_dict,
                    nodes_explored=result.nodes_explored,
                    nodes_pruned=result.nodes_pruned,
                    simulations=result.simulations,
                    elapsed=time.time() - start_time
                ))
            
        # 7. Search Progress
        current_time = time.time()
        if (i % progress_step == 0 or current_time - last_progress_time >= 0.1):
            if event_callback:
                event_callback(AlgorithmEvent(
                    type=EventType.SEARCH_PROGRESS,
                    timestamp=current_time,
                    message=f"Progress: iter {i}/{iterations} | Best: {result.best_score:.1f}",
                    iteration=i,
                    best_score=result.best_score if result.best_score < float('inf') else None,
                    score=sim_score,
                    nodes_explored=result.nodes_explored,
                    nodes_pruned=result.nodes_pruned,
                    simulations=result.simulations,
                    elapsed=current_time - start_time
                ))
            last_progress_time = current_time
                
        result.iterations = i + 1
        
    result.nodes_created = MCTSNode._next_id
    result.runtime = time.time() - start_time
    if result.status == 'RUNNING':
        result.status = 'COMPLETED'
        if event_callback:
            event_callback(AlgorithmEvent(
                type=EventType.SEARCH_COMPLETED,
                timestamp=time.time(),
                message=f"MCTS completed {result.iterations} iterations. Best score: {result.best_score:.1f} ({result.num_colors} colors) in {result.runtime:.2f}s",
                iteration=result.iterations,
                best_score=result.best_score if result.best_score < float('inf') else None,
                score=result.best_score if result.best_score < float('inf') else None,
                num_colors=result.num_colors,
                coloring=result.best_coloring,
                nodes_explored=result.nodes_explored,
                nodes_pruned=result.nodes_pruned,
                simulations=result.simulations,
                runtime=result.runtime,
                is_optimal=False
            ))
            
    return result
