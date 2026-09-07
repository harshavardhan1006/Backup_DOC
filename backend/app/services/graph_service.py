import uuid
from typing import Optional
from datetime import datetime
from app.models.graph import Graph, GraphInfo
from datasets.presets import get_preset_graphs


class GraphService:
    """In-memory graph store with preset loading."""

    def __init__(self):
        self._graphs: dict[str, tuple[Graph, GraphInfo]] = {}
        self.load_presets()

    def _make_info(self, graph: Graph, graph_id: str, name: str, source: str = 'generated') -> GraphInfo:
        """Create a GraphInfo from a Graph object."""
        weights = graph.weights[:graph.num_vertices]
        return GraphInfo(
            id=graph_id,
            name=name,
            num_vertices=graph.num_vertices,
            num_edges=graph.num_edges(),
            density=graph.density(),
            weight_range=(min(weights) if weights else 0, max(weights) if weights else 0),
            source=source,
            created_at=datetime.utcnow(),
            status='ready',
        )

    def add_graph(self, graph: Graph, name: str, source: str = 'generated') -> str:
        """Add a graph to the store and return its ID."""
        graph_id = str(uuid.uuid4())
        info = self._make_info(graph, graph_id, name, source)
        self._graphs[graph_id] = (graph, info)
        return graph_id

    def get_graph(self, graph_id: str) -> Optional[Graph]:
        entry = self._graphs.get(graph_id)
        return entry[0] if entry else None

    def get_info(self, graph_id: str) -> Optional[GraphInfo]:
        entry = self._graphs.get(graph_id)
        return entry[1] if entry else None

    def list_graphs(self) -> list[GraphInfo]:
        return [info for _, info in self._graphs.values()]

    def delete_graph(self, graph_id: str) -> bool:
        if graph_id in self._graphs:
            del self._graphs[graph_id]
            return True
        return False

    def load_presets(self):
        """Load predefined demo graphs."""
        presets = get_preset_graphs()
        for name, g in presets.items():
            preset_id = f"preset_{name}"
            info = self._make_info(g, preset_id, f"Preset: {name.capitalize()}", 'preset')
            self._graphs[preset_id] = (g, info)
