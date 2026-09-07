import random
from app.models.graph import Graph

def generate_random_graph(
    num_vertices: int,
    edge_probability: float = 0.3,
    min_weight: int = 1,
    max_weight: int = 100,
    seed: int = 42,
) -> Graph:
    """Generate a random weighted graph (Erdos-Renyi model)."""
    random.seed(seed)
    graph = Graph(num_vertices)
    for i in range(num_vertices):
        weight = random.randint(min_weight, max_weight)
        # vertex weights are automatically initialized to 1, override them
        graph.weights[i] = weight
        
    for i in range(num_vertices):
        for j in range(i + 1, num_vertices):
            if random.random() < edge_probability:
                graph.add_edge(i, j)
                
    return graph

def generate_large_graph(
    num_vertices: int,
    edge_probability: float = 0.001,
    min_weight: int = 1,
    max_weight: int = 100,
    seed: int = 42,
    progress_callback=None,
) -> Graph:
    """Generate large graph with progress reporting. Uses sparse edge generation."""
    random.seed(seed)
    graph = Graph(num_vertices)
    
    for i in range(num_vertices):
        graph.weights[i] = random.randint(min_weight, max_weight)
        
    # For large graphs, we can sample edges instead of O(V^2) checks
    max_edges = (num_vertices * (num_vertices - 1)) // 2
    expected_edges = int(max_edges * edge_probability)
    
    edges_added = 0
    while edges_added < expected_edges:
        u = random.randint(0, num_vertices - 1)
        v = random.randint(0, num_vertices - 1)
        if u != v and v not in graph.adj[u]:
            graph.add_edge(u, v)
            edges_added += 1
            if progress_callback and edges_added % 10000 == 0:
                progress_callback(edges_added / expected_edges)
                
    if progress_callback:
        progress_callback(1.0)
        
    return graph
