from enum import Enum
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Any, Optional, Dict
import time

class EventType(str, Enum):
    SEARCH_STARTED = 'SEARCH_STARTED'
    ITERATION_STARTED = 'ITERATION_STARTED'
    NODE_SELECTED = 'NODE_SELECTED'
    NODE_EXPANDED = 'NODE_EXPANDED'
    SIMULATION_STARTED = 'SIMULATION_STARTED'
    SIMULATION_COMPLETED = 'SIMULATION_COMPLETED'
    COLOR_ASSIGNED = 'COLOR_ASSIGNED'
    NEW_BEST_SOLUTION = 'NEW_BEST_SOLUTION'
    BACKPROPAGATION = 'BACKPROPAGATION'
    NODE_PRUNED = 'NODE_PRUNED'
    BRANCH_STARTED = 'BRANCH_STARTED'
    BRANCH_PRUNED = 'BRANCH_PRUNED'
    CONFLICT_DETECTED = 'CONFLICT_DETECTED'
    STATE_EXPLORED = 'STATE_EXPLORED'
    BEST_SOLUTION_UPDATED = 'BEST_SOLUTION_UPDATED'
    SEARCH_PROGRESS = 'SEARCH_PROGRESS'
    SEARCH_COMPLETED = 'SEARCH_COMPLETED'
    SEARCH_TIMEOUT = 'SEARCH_TIMEOUT'
    ERROR = 'ERROR'

class AlgorithmEvent(BaseModel):
    model_config = ConfigDict(extra='allow')

    type: EventType
    timestamp: float = Field(default_factory=time.time)
    iteration: Optional[int] = None
    node_id: Optional[str] = None
    vertex: Optional[int] = None
    color: Optional[int] = None
    score: Optional[float] = None
    best_score: Optional[float] = None
    coloring: Optional[Dict[Any, Any]] = None
    nodes_explored: Optional[int] = None
    nodes_pruned: Optional[int] = None
    simulations: Optional[int] = None
    elapsed: Optional[float] = None
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

    @field_validator('coloring', mode='before')
    @classmethod
    def coerce_coloring_keys(cls, v):
        if isinstance(v, dict):
            return {str(k): int(val) for k, val in v.items()}
        return v
