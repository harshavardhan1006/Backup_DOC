from __future__ import annotations
from typing import Dict, List, Optional
from pydantic import BaseModel
from .graph import Graph

class Coloring:
    def __init__(self, num_vertices: int):
        self.num_vertices = num_vertices
        self.colors: List[int] = [-1] * num_vertices
    
    def assign(self, vertex: int, color: int):
        self.colors[vertex] = color

    def get_color(self, vertex: int) -> int:
        return self.colors[vertex]

    def is_complete(self) -> bool:
        return -1 not in self.colors

    def is_valid(self, graph: Graph) -> bool:
        for u, v in graph.edges:
            if self.colors[u] != -1 and self.colors[v] != -1 and self.colors[u] == self.colors[v]:
                return False
        return True

    def get_color_classes(self) -> Dict[int, List[int]]:
        classes = {}
        for v, c in enumerate(self.colors):
            if c != -1:
                if c not in classes:
                    classes[c] = []
                classes[c].append(v)
        return classes

    def num_colors_used(self) -> int:
        return len(set(c for c in self.colors if c != -1))

    def copy(self) -> 'Coloring':
        new_coloring = Coloring(self.num_vertices)
        new_coloring.colors = self.colors.copy()
        return new_coloring

    def to_dict(self) -> Dict[str, int]:
        return {str(i): c for i, c in enumerate(self.colors)}

class SolutionResult(BaseModel):
    score: float
    num_colors: int
    coloring: Dict[str, int]
    color_classes: Dict[int, List[int]]
    max_weights_per_class: Dict[int, int]
    is_optimal: bool
    status: str
    runtime: float
    iterations: int
    nodes_explored: int
    nodes_pruned: int
    simulations: int

class AlgorithmConfig(BaseModel):
    algorithm: str
    time_limit: int
    iterations: int
    exploration_coeff: float
    simulation_strategy: str
    seed: Optional[int] = None
