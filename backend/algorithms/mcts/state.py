from typing import Optional, List, Dict
from app.models.graph import Graph
from app.models.solution import Coloring
from algorithms.mcts.delta_state import DeltaState


class WVCPState(DeltaState):
    """
    WVCPState representation for MCTS.
    
    Backed by DeltaState for O(1) memory per tree node (structural sharing),
    completely eliminating O(V) full-array cloning on node expansion.
    Preserves all existing methods and caller interfaces.
    """

    def __init__(
        self,
        graph: Graph,
        coloring: Optional[Coloring] = None,
        vertex_order: Optional[List[int]] = None,
        partial_score: Optional[float] = None,
        max_weight_per_color: Optional[Dict[int, int]] = None,
        parent: Optional[DeltaState] = None,
        vertex: int = -1,
        color: int = -1,
        depth: int = 0,
    ):
        super().__init__(
            graph=graph,
            parent=parent,
            vertex=vertex,
            color=color,
            vertex_order=vertex_order,
            partial_score=partial_score,
            max_weight_per_color=max_weight_per_color,
            depth=depth,
            initial_coloring=coloring,
        )

    def apply_action(self, color: int) -> 'WVCPState':
        """
        Applies a color assignment in O(1) time and memory.
        Returns a new child WVCPState sharing the parent chain.
        """
        v = self.current_vertex()
        w = self.graph.weights[v]

        # Incremental update of max weights per color class (O(k), k << V)
        new_mwpc = dict(self.max_weight_per_color)
        old_max = new_mwpc.get(color, 0)
        new_max = max(old_max, w)
        new_mwpc[color] = new_max

        # Incremental WVCP objective update (O(1))
        new_partial_score = self.partial_score + (new_max - old_max)

        return WVCPState(
            graph=self.graph,
            parent=self,
            vertex=v,
            color=color,
            vertex_order=self.vertex_order,
            partial_score=new_partial_score,
            max_weight_per_color=new_mwpc,
            depth=self.depth + 1,
        )
