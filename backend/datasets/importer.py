import csv
import json
import io
from typing import Tuple, Optional
from app.models.graph import Graph

class ImportResult:
    def __init__(self):
        self.graph: Optional[Graph] = None
        self.format: str = ''
        self.errors: list[str] = []
        self.warnings: list[str] = []
        self.is_valid: bool = False
        self.stats: dict = {}

def _validate_graph(graph: Graph) -> list[str]:
    """Validate the imported graph."""
    errors = []
    if graph.num_vertices == 0:
        errors.append("Graph is empty (0 vertices).")
    
    for i, weight in enumerate(graph.weights):
        if weight <= 0:
            errors.append(f"Vertex {i} has non-positive weight: {weight}")
            
    # Check bounds of edges
    for i in range(graph.num_vertices):
        for neighbor in graph.adj[i]:
            if neighbor < 0 or neighbor >= graph.num_vertices:
                errors.append(f"Edge from {i} to invalid vertex {neighbor}")
                
    return errors

def import_csv(content: str) -> ImportResult:
    """Import from CSV format."""
    result = ImportResult()
    result.format = 'csv'
    
    try:
        reader = csv.reader(io.StringIO(content.strip()))
        lines = list(reader)
        
        weights = []
        edges = []
        parsing_edges = False
        
        for row in lines:
            if not row or not any(row):
                if weights:
                    parsing_edges = True
                continue
            
            if row[0].lower() in ('v', 'vertex', 'vertex_id', 'source', 'target', 'weight'):
                continue # header
                
            try:
                if not parsing_edges:
                    if len(row) >= 2:
                        vid = int(row[0])
                        w = int(row[1])
                        if vid >= len(weights):
                            weights.extend([1] * (vid - len(weights) + 1))
                        weights[vid] = w
                    else:
                        parsing_edges = True
                
                if parsing_edges and len(row) >= 2:
                    edges.append((int(row[0]), int(row[1])))
            except ValueError:
                pass
        
        if not weights and edges:
            max_v = max([max(u, v) for u, v in edges])
            weights = [1] * (max_v + 1)
            
        graph = Graph(len(weights))
        for i, w in enumerate(weights):
            graph.weights[i] = w
            
        for u, v in edges:
            if u != v:
                try:
                    graph.add_edge(u, v)
                except Exception:
                    pass
                    
        result.graph = graph
        result.errors = _validate_graph(graph)
        result.is_valid = len(result.errors) == 0
        result.stats = {'vertices': graph.num_vertices, 'edges': graph.num_edges()}
        
    except Exception as e:
        result.errors.append(f"Failed to parse CSV: {str(e)}")
        
    return result

def import_json(content: str) -> ImportResult:
    """Import from JSON format: {"vertices": [{"id": 1, "weight": 8}], "edges": [[1,2]]}"""
    result = ImportResult()
    result.format = 'json'
    
    try:
        data = json.loads(content)
        
        vertices = data.get('vertices', [])
        edges = data.get('edges', [])
        
        if isinstance(vertices, list) and len(vertices) > 0:
            if isinstance(vertices[0], dict):
                max_id = max(v.get('id', i) for i, v in enumerate(vertices))
                graph = Graph(max_id + 1)
                for i, v in enumerate(vertices):
                    vid = v.get('id', i)
                    weight = v.get('weight', 1)
                    graph.weights[vid] = weight
            else:
                graph = Graph(len(vertices))
                for i, w in enumerate(vertices):
                    graph.weights[i] = w
        else:
            graph = Graph(0)
            
        for edge in edges:
            if len(edge) == 2:
                u, v = edge
                if u != v:
                    graph.add_edge(u, v)
                    
        result.graph = graph
        result.errors = _validate_graph(graph)
        result.is_valid = len(result.errors) == 0
        result.stats = {'vertices': graph.num_vertices, 'edges': graph.num_edges()}
        
    except Exception as e:
        result.errors.append(f"Failed to parse JSON: {str(e)}")
        
    return result

def import_txt(content: str) -> ImportResult:
    """Import from TXT/edge-list format."""
    result = ImportResult()
    result.format = 'txt'
    
    try:
        lines = content.strip().split('\n')
        edges = []
        weights = {}
        max_v = -1
        
        parsing_mode = 'edges'
        
        for line in lines:
            line = line.strip()
            if not line or line.startswith('%'):
                continue
            
            if line.startswith('#'):
                if 'vertices' in line.lower() or 'weights' in line.lower():
                    parsing_mode = 'vertices'
                elif 'edges' in line.lower():
                    parsing_mode = 'edges'
                continue
                
            parts = line.split()
            if not parts:
                continue
                
            if parsing_mode == 'vertices' and len(parts) >= 2:
                try:
                    v, w = int(parts[0]), int(parts[1])
                    weights[v] = w
                    max_v = max(max_v, v)
                except ValueError:
                    pass
            elif len(parts) >= 2:
                try:
                    u, v = int(parts[0]), int(parts[1])
                    edges.append((u, v))
                    max_v = max(max_v, u, v)
                except ValueError:
                    pass
                    
        graph = Graph(max_v + 1)
        for v, w in weights.items():
            graph.weights[v] = w
            
        for u, v in edges:
            if u != v:
                graph.add_edge(u, v)
                
        result.graph = graph
        result.errors = _validate_graph(graph)
        result.is_valid = len(result.errors) == 0
        result.stats = {'vertices': graph.num_vertices, 'edges': graph.num_edges()}
        
    except Exception as e:
        result.errors.append(f"Failed to parse TXT: {str(e)}")
        
    return result

def import_graph(content: str, filename: str, format_hint: str = None) -> ImportResult:
    """Import a graph from file content. Auto-detect format from filename."""
    fmt = format_hint
    if not fmt:
        if filename.endswith('.json'):
            fmt = 'json'
        elif filename.endswith('.csv'):
            fmt = 'csv'
        else:
            fmt = 'txt'
            
    if fmt == 'json':
        return import_json(content)
    elif fmt == 'csv':
        return import_csv(content)
    else:
        return import_txt(content)
