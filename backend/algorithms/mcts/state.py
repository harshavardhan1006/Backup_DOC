from app.models.graph import Graph
from app.models.solution import Coloring
from algorithms.wvcp import wvcp_score, get_legal_colors, is_valid_coloring

class WVCPState:
    def __init__(self, graph: Graph, coloring: Coloring = None, vertex_order: list[int] = None):
        self.graph = graph
        self.coloring = coloring or Coloring(graph.num_vertices)
        # vertex_order: order in which we color vertices (e.g., by weight descending)
        self.vertex_order = vertex_order or sorted(range(graph.num_vertices), key=lambda v: graph.weights[v], reverse=True)
        self.current_index = 0  # index into vertex_order of next vertex to color
        # Track which vertices are already colored
        for i, v in enumerate(self.vertex_order):
            if self.coloring.get_color(v) >= 0:
                self.current_index = i + 1
            else:
                break
    
    def current_vertex(self) -> int:
        if self.is_terminal():
            return -1
        return self.vertex_order[self.current_index]

    def is_terminal(self) -> bool:
        return self.current_index >= self.graph.num_vertices

    def get_legal_actions(self) -> list[int]:
        if self.is_terminal():
            return []
        v = self.current_vertex()
        return get_legal_colors(self.graph, self.coloring, v)

    def apply_action(self, color: int) -> 'WVCPState':
        v = self.current_vertex()
        new_coloring = self.coloring.copy()
        new_coloring.assign(v, color)
        return WVCPState(self.graph, new_coloring, self.vertex_order)

    def get_score(self) -> float:
        return wvcp_score(self.graph, self.coloring)

    def get_partial_score(self) -> float:
        return wvcp_score(self.graph, self.coloring)

    def copy(self) -> 'WVCPState':
        return WVCPState(self.graph, self.coloring.copy(), self.vertex_order.copy())
