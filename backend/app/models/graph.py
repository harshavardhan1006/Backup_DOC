from __future__ import annotations
from typing import List, Set, Tuple, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

class Graph:
    def __init__(self, num_vertices: int):
        self.num_vertices = num_vertices
        self.weights: List[int] = [0] * num_vertices
        self.adj: List[Set[int]] = [set() for _ in range(num_vertices)]
        self.edges: List[Tuple[int, int]] = []
    
    def add_vertex(self, weight: int) -> int:
        self.weights.append(weight)
        self.adj.append(set())
        self.num_vertices += 1
        return self.num_vertices - 1

    def add_edge(self, u: int, v: int) -> None:
        if u != v and not self.has_edge(u, v):
            self.adj[u].add(v)
            self.adj[v].add(u)
            self.edges.append((u, v))

    def has_edge(self, u: int, v: int) -> bool:
        return v in self.adj[u]

    def degree(self, v: int) -> int:
        return len(self.adj[v])

    def neighbors(self, v: int) -> Set[int]:
        return self.adj[v]

    def density(self) -> float:
        if self.num_vertices <= 1:
            return 0.0
        max_edges = self.num_vertices * (self.num_vertices - 1) / 2
        return len(self.edges) / max_edges

    def num_edges(self) -> int:
        return len(self.edges)

    def validate(self) -> List[str]:
        errors = []
        if any(w <= 0 for w in self.weights):
            errors.append("All weights must be positive integers.")
        if len(self.weights) != self.num_vertices:
            errors.append("Mismatch between num_vertices and weights.")
        if len(self.adj) != self.num_vertices:
            errors.append("Mismatch between num_vertices and adjacency list.")
        return errors

    def get_statistics(self) -> Dict[str, Any]:
        if not self.weights:
            return {}
        degrees = [self.degree(v) for v in range(self.num_vertices)]
        
        # Calculate connected components
        visited = set()
        components = 0
        for i in range(self.num_vertices):
            if i not in visited:
                components += 1
                queue = [i]
                while queue:
                    curr = queue.pop(0)
                    if curr not in visited:
                        visited.add(curr)
                        queue.extend(list(self.adj[curr] - visited))

        return {
            "num_vertices": self.num_vertices,
            "num_edges": self.num_edges(),
            "density": self.density(),
            "min_weight": min(self.weights),
            "max_weight": max(self.weights),
            "avg_weight": sum(self.weights) / self.num_vertices,
            "min_degree": min(degrees) if degrees else 0,
            "max_degree": max(degrees) if degrees else 0,
            "avg_degree": sum(degrees) / self.num_vertices if degrees else 0,
            "connected_components": components
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "num_vertices": self.num_vertices,
            "weights": self.weights,
            "edges": self.edges
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'Graph':
        g = Graph(data["num_vertices"])
        g.weights = data.get("weights", [0] * g.num_vertices)
        for u, v in data.get("edges", []):
            g.add_edge(u, v)
        return g

class GraphConfig(BaseModel):
    num_vertices: int
    edge_probability: float
    min_weight: int
    max_weight: int
    seed: Optional[int] = None

class GraphInfo(BaseModel):
    id: str
    name: str
    num_vertices: int
    num_edges: int
    density: float
    weight_range: Tuple[int, int]
    source: str
    created_at: datetime
    status: str
