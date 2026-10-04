from typing import Optional, List, Dict
from app.models.graph import Graph
from app.models.solution import Coloring


class DeltaState:
    """
    Memory-efficient, structurally-shared MCTS state for the Weighted Vertex Coloring Problem.
    
    Instead of storing or copying a full V-sized coloring array at every tree node,
    each DeltaState stores only:
      - A reference to its parent state
      - The single vertex and color assigned at this step
      - The incremental partial WVCP score
      - An incrementally maintained dictionary of maximum weights per active color class
      
    Child creation via apply_action() is O(1) in memory and time (or O(k) for shallow copying
    the small max_weights dict of k active colors, k << V), completely eliminating O(V) clones.
    
    The complete Coloring array is materialized on-demand via materialize_coloring(),
    which is called at most once per simulation rollout.
    """

    def __init__(
        self,
        graph: Graph,
        parent: Optional['DeltaState'] = None,
        vertex: int = -1,
        color: int = -1,
        vertex_order: Optional[List[int]] = None,
        partial_score: Optional[float] = None,
        max_weight_per_color: Optional[Dict[int, int]] = None,
        depth: int = 0,
        initial_coloring: Optional[Coloring] = None,
    ):
        self.graph = graph
        self.parent = parent
        self.vertex = vertex
        self.color = color
        self.depth = depth

        # Share vertex ordering across the entire search tree
        if vertex_order is not None:
            self.vertex_order = vertex_order
        elif parent is not None:
            self.vertex_order = parent.vertex_order
        else:
            self.vertex_order = sorted(
                range(graph.num_vertices),
                key=lambda v: graph.weights[v],
                reverse=True
            )

        if parent is None:
            # Root state
            self._initial_coloring = initial_coloring
            if initial_coloring is not None:
                # Handle legacy callers or tests passing an initial partial coloring
                if max_weight_per_color is not None:
                    self.max_weight_per_color = dict(max_weight_per_color)
                else:
                    self.max_weight_per_color = {}
                    for v_idx, c in enumerate(initial_coloring.colors):
                        if c >= 0:
                            w = graph.weights[v_idx]
                            if c not in self.max_weight_per_color or w > self.max_weight_per_color[c]:
                                self.max_weight_per_color[c] = w
                
                if partial_score is not None:
                    self.partial_score = partial_score
                else:
                    self.partial_score = float(sum(self.max_weight_per_color.values()))

                self.current_index = 0
                for i, v in enumerate(self.vertex_order):
                    if initial_coloring.get_color(v) >= 0:
                        self.current_index = i + 1
                    else:
                        break
            else:
                self.max_weight_per_color = dict(max_weight_per_color) if max_weight_per_color is not None else {}
                self.partial_score = partial_score if partial_score is not None else 0.0
                self.current_index = 0
        else:
            # Child state: structural sharing with parent
            self._initial_coloring = parent._initial_coloring
            self.current_index = parent.current_index + 1
            self.max_weight_per_color = max_weight_per_color if max_weight_per_color is not None else {}
            self.partial_score = partial_score if partial_score is not None else 0.0

    def current_vertex(self) -> int:
        """Returns the vertex to be colored next, or -1 if terminal."""
        if self.is_terminal():
            return -1
        return self.vertex_order[self.current_index]

    def is_terminal(self) -> bool:
        """Returns True if all vertices in the graph have been colored."""
        return self.current_index >= self.graph.num_vertices

    def get_legal_actions(self) -> List[int]:
        """
        Determines legal colors for current_vertex() without O(V) full-array scans.
        
        Inspects colored neighbors by traversing the delta chain back to root in O(d).
        Existing active colors are retrieved from max_weight_per_color.keys() in O(k).
        Symmetry breaking allows all valid existing colors plus at most one new color.
        """
        if self.is_terminal():
            return []

        v = self.current_vertex()
        adj_v = self.graph.adj[v]

        neighbor_colors = set()
        if adj_v:
            curr = self
            while curr is not None and curr.vertex != -1:
                if curr.vertex in adj_v:
                    neighbor_colors.add(curr.color)
                    if len(neighbor_colors) == len(adj_v):
                        break  # Early exit: found all neighbors
                curr = curr.parent
            
            if curr is not None and curr._initial_coloring is not None:
                for neighbor in adj_v:
                    col = curr._initial_coloring.get_color(neighbor)
                    if col >= 0:
                        neighbor_colors.add(col)

        all_used_colors = sorted(self.max_weight_per_color.keys())
        legal = [c for c in all_used_colors if c not in neighbor_colors]

        # Symmetry breaking: allow at most one new color class
        next_new = (max(all_used_colors) + 1) if all_used_colors else 0
        legal.append(next_new)
        return legal

    def apply_action(self, color: int) -> 'DeltaState':
        """
        Applies a color assignment in O(1) time and memory.
        
        Calculates the incremental WVCP objective update:
          - If color is existing: contribution increases by max(0, w - old_max_weight)
          - If color is new: contribution increases by w
        Returns a new child DeltaState sharing the parent chain. No O(V) cloning.
        """
        v = self.current_vertex()
        w = self.graph.weights[v]

        # Shallow copy of the small active color dictionary (k entries, k << V)
        new_mwpc = dict(self.max_weight_per_color)
        old_max = new_mwpc.get(color, 0)
        new_max = max(old_max, w)
        new_mwpc[color] = new_max

        # Incremental WVCP objective update: O(1)
        new_partial_score = self.partial_score + (new_max - old_max)

        return DeltaState(
            graph=self.graph,
            parent=self,
            vertex=v,
            color=color,
            vertex_order=self.vertex_order,
            partial_score=new_partial_score,
            max_weight_per_color=new_mwpc,
            depth=self.depth + 1,
        )

    def materialize_coloring(self) -> Coloring:
        """
        Materializes a complete V-sized Coloring object representing this partial state.
        
        Unassigned vertices remain -1. Assigned vertices along the delta chain
        receive their respective color assignments.
        Called on-demand once per simulation rollout entry.
        """
        n = self.graph.num_vertices
        if self._initial_coloring is not None:
            colors = list(self._initial_coloring.colors)
        else:
            colors = [-1] * n

        curr = self
        while curr is not None and curr.vertex != -1:
            colors[curr.vertex] = curr.color
            curr = curr.parent

        return Coloring(n, colors)

    @property
    def coloring(self) -> Coloring:
        """Backwards compatibility property: materializes coloring on demand."""
        return self.materialize_coloring()

    def get_color(self, vertex: int) -> int:
        """Queries the assigned color of a vertex by walking the delta chain."""
        curr = self
        while curr is not None and curr.vertex != -1:
            if curr.vertex == vertex:
                return curr.color
            curr = curr.parent
        if curr is not None and curr._initial_coloring is not None:
            return curr._initial_coloring.get_color(vertex)
        return -1

    def get_score(self) -> float:
        """Returns the incremental WVCP score in O(1)."""
        return self.partial_score

    def get_partial_score(self) -> float:
        """Returns the incremental WVCP partial score lower-bound in O(1)."""
        return self.partial_score

    def copy(self) -> 'DeltaState':
        """DeltaStates are immutable along their chain; return self in O(1)."""
        return self
