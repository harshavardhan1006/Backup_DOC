from algorithms.mcts.node import MCTSNode


def select(node: MCTSNode, exploration: float = 1.414, best_score: float = float('inf')) -> tuple:
    """Select a node using UCT policy. Traverse from root to a leaf.
    
    Performs incremental pruning during descent: children whose partial_score
    >= best_score are pruned (they can't lead to a better solution).
    
    Returns:
        (selected_node, newly_pruned_count)
    """
    current = node
    newly_pruned = 0
    while not current.is_terminal() and current.is_fully_expanded():
        # Incremental pruning: check children against best_score bound
        for child in current.children:
            if not child.is_pruned and child.state.partial_score >= best_score:
                child.is_pruned = True
                newly_pruned += 1

        child = current.best_child(exploration)
        if child is None:
            break
        current = child
    return current, newly_pruned
