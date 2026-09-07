import random
from app.models.graph import Graph


def create_tiny_graph() -> Graph:
    """5-vertex graph for quick demos."""
    g = Graph(5)
    weights = [5, 2, 8, 3, 6]
    for i, w in enumerate(weights):
        g.weights[i] = w
    edges = [(0, 1), (0, 2), (1, 3), (2, 3), (3, 4)]
    for u, v in edges:
        g.add_edge(u, v)
    return g


def create_small_graph() -> Graph:
    """8-vertex graph with moderate connectivity."""
    g = Graph(8)
    weights = [10, 20, 15, 5, 25, 30, 10, 5]
    for i, w in enumerate(weights):
        g.weights[i] = w
    edges = [(0, 1), (0, 2), (1, 3), (2, 3), (3, 4), (4, 5), (5, 6), (6, 7), (7, 0), (1, 5)]
    for u, v in edges:
        g.add_edge(u, v)
    return g


def create_medium_graph() -> Graph:
    """15-vertex graph with cycle + random chords."""
    g = Graph(15)
    rng = random.Random(123)
    for i in range(15):
        g.weights[i] = rng.randint(10, 50)
    # Connected cycle
    for i in range(15):
        g.add_edge(i, (i + 1) % 15)
    # Random chords
    for _ in range(10):
        u = rng.randint(0, 14)
        v = rng.randint(0, 14)
        if u != v:
            g.add_edge(u, v)
    return g


def create_dense_graph() -> Graph:
    """10-vertex dense graph."""
    g = Graph(10)
    for i in range(10):
        g.weights[i] = i * 2 + 1
    for i in range(10):
        for j in range(i + 1, 10):
            if (i + j) % 3 != 0:
                g.add_edge(i, j)
    return g


def create_larger_graph() -> Graph:
    """25-vertex graph with ~20% edge probability."""
    g = Graph(25)
    rng = random.Random(456)
    for i in range(25):
        g.weights[i] = rng.randint(1, 100)
    for i in range(25):
        for j in range(i + 1, 25):
            if rng.random() < 0.2:
                g.add_edge(i, j)
    # Ensure connected
    for i in range(1, 25):
        if not g.adj[i]:
            g.add_edge(i, rng.randint(0, i - 1))
    return g


def get_preset_graphs() -> dict[str, Graph]:
    """Return all predefined demo graphs."""
    return {
        'tiny': create_tiny_graph(),
        'small': create_small_graph(),
        'medium': create_medium_graph(),
        'dense': create_dense_graph(),
        'larger': create_larger_graph(),
    }
