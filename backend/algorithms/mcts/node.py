import math
from typing import Optional
from algorithms.mcts.state import WVCPState

class MCTSNode:
    _next_id = 0
    
    def __init__(self, state: WVCPState, parent: 'MCTSNode' = None, action: int = None):
        MCTSNode._next_id += 1
        self.id = f'node_{MCTSNode._next_id}'
        self.state = state
        self.parent = parent
        self.action = action  # color that was assigned to get here
        self.children: list['MCTSNode'] = []
        self.visits: int = 0
        self.total_reward: float = 0.0
        self.best_score: float = float('inf')
        self.untried_actions: list[int] = []
        self.is_expanded: bool = False
        self.is_pruned: bool = False
        self.depth: int = (parent.depth + 1) if parent else 0
    
    def ucb1(self, exploration: float = 1.414) -> float:
        if self.visits == 0:
            return float('inf')
        avg_reward = self.total_reward / self.visits
        return avg_reward + exploration * math.sqrt(math.log(self.parent.visits) / self.visits)
        
    def best_child(self, exploration: float = 1.414) -> 'MCTSNode':
        return max((child for child in self.children if not child.is_pruned), key=lambda c: c.ucb1(exploration), default=None)
        
    def is_fully_expanded(self) -> bool:
        return self.is_expanded and not self.untried_actions
        
    def is_terminal(self) -> bool:
        return self.state.is_terminal()
        
    def to_dict(self) -> dict:
        avg_reward = self.total_reward / self.visits if self.visits > 0 else 0.0
        return {
            'id': self.id,
            'depth': self.depth,
            'visits': self.visits,
            'avg_reward': avg_reward,
            'best_score': self.best_score,
            'num_children': len(self.children),
            'is_pruned': self.is_pruned
        }
