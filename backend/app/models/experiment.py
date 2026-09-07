from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from .solution import AlgorithmConfig

class ExperimentConfig(BaseModel):
    graph_sizes: List[int]
    algorithms: List[str]
    strategies: List[str]
    time_limit: int
    iterations: int
    num_repetitions: int
    density: float
    weight_range: List[int]
    seed: Optional[int] = None

class ExperimentResult(BaseModel):
    experiment_id: str
    timestamp: float
    graph_id: str
    graph_size: int
    edge_count: int
    density: float
    algorithm: str
    simulation_strategy: str
    iterations: int
    time_limit: int
    exploration_coeff: float
    seed: Optional[int]
    runtime: float
    status: str
    score: float
    num_colors: int
    nodes_explored: int
    nodes_pruned: int
    simulations: int
    optimality_gap: Optional[float] = None
    speedup: Optional[float] = None

class ComparisonRequest(BaseModel):
    graph_id: Optional[str] = None
    graph_config: Optional[Dict[str, Any]] = None
    algorithms: List[AlgorithmConfig]

class ComparisonResult(BaseModel):
    graph_info: Dict[str, Any]
    results: Dict[str, Any]
