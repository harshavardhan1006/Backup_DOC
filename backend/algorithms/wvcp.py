from app.models.graph import Graph
from app.models.solution import Coloring
from typing import List

def wvcp_score(graph: Graph, coloring: Coloring) -> float:
    """Calculate the WVCP objective: sum of max weights per color class."""
    color_classes = coloring.get_color_classes()
    total = 0.0
    for color, vertices in color_classes.items():
        if vertices:
            max_weight = max(graph.weights[v] for v in vertices)
            total += max_weight
    return total

def is_valid_coloring(graph: Graph, coloring: Coloring) -> bool:
    """Check if coloring is valid (no adjacent vertices share color)."""
    return coloring.is_valid(graph)

def get_legal_colors(graph: Graph, coloring: Coloring, vertex: int, max_colors: int = -1) -> List[int]:
    """
    Get list of legal colors for a vertex.
    Symmetry breaking: allows assigning any valid existing color,
    plus at most one new color to avoid exploring isomorphic color permutations.
    """
    neighbor_colors = {coloring.get_color(v) for v in graph.neighbors(vertex)}
    neighbor_colors.discard(-1)
    
    # All colors currently active in the graph
    all_used_colors = {c for c in coloring.colors if c >= 0}
    
    legal_colors = []
    # Try existing used colors first
    for c in sorted(all_used_colors):
        if c not in neighbor_colors:
            if max_colors == -1 or c < max_colors:
                legal_colors.append(c)
                
    # Add exactly one new color
    next_new_color = (max(all_used_colors) + 1) if all_used_colors else 0
    if max_colors == -1 or next_new_color < max_colors:
        legal_colors.append(next_new_color)
        
    return legal_colors
