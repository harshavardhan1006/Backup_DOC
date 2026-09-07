from algorithms.mcts.node import MCTSNode

def prune_node(node: MCTSNode, best_known_score: float) -> list[str]:
    """Prune nodes whose partial score already exceeds best known.
    Returns list of pruned node IDs."""
    pruned_ids = []
    partial = node.state.get_partial_score()
    if partial >= best_known_score:
        node.is_pruned = True
        pruned_ids.append(node.id)
    for child in node.children:
        if not child.is_pruned:
            pruned_ids.extend(prune_node(child, best_known_score))
    return pruned_ids
