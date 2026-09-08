from algorithms.mcts.node import MCTSNode


def prune_on_improvement(node: MCTSNode, new_best_score: float) -> int:
    """Sweep the tree to prune nodes whose partial_score >= new_best_score.
    
    Called only when best_score improves (not every iteration).
    Uses iterative DFS to avoid Python recursion limit on deep trees.
    
    Since partial_score is monotonically non-decreasing along any root-to-leaf
    path (coloring more vertices can only add/increase max-weight contributions),
    pruning a node implicitly prunes its entire subtree — selection will never
    descend into a pruned node.
    
    Returns:
        Number of newly pruned nodes.
    """
    pruned_count = 0
    stack = [node]
    while stack:
        n = stack.pop()
        if n.is_pruned:
            continue
        if n.state.partial_score >= new_best_score:
            n.is_pruned = True
            pruned_count += 1
            # All descendants have partial_score >= this node's partial_score,
            # so they're implicitly pruned. No need to traverse subtree.
            continue
        for child in n.children:
            if not child.is_pruned:
                stack.append(child)
    return pruned_count


# Keep the old function signature as a compatibility alias that delegates
# to the new implementation, so any external callers still work.
def prune_node(node: MCTSNode, best_known_score: float) -> list[str]:
    """Legacy compatibility wrapper. Returns list of pruned node IDs."""
    pruned_ids = []
    stack = [node]
    while stack:
        n = stack.pop()
        if n.is_pruned:
            continue
        if n.state.partial_score >= best_known_score:
            n.is_pruned = True
            pruned_ids.append(n.id)
            continue
        for child in n.children:
            if not child.is_pruned:
                stack.append(child)
    return pruned_ids
