from algorithms.mcts.node import MCTSNode

def select(node: MCTSNode, exploration: float = 1.414) -> MCTSNode:
    """Select a node using UCT policy. Traverse from root to a leaf."""
    current = node
    while not current.is_terminal() and current.is_fully_expanded():
        child = current.best_child(exploration)
        if child is None:
            break
        current = child
    return current
