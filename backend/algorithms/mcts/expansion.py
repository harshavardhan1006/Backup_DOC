from algorithms.mcts.node import MCTSNode

def expand(node: MCTSNode) -> MCTSNode:
    """
    Expand a node by adding one untried child.
    
    Uses structurally-shared DeltaState via node.state.apply_action(action),
    achieving O(1) child expansion with zero O(V) array copies.
    """
    if not node.untried_actions and not node.is_expanded:
        actions = node.state.get_legal_actions()
        tried = {child.action for child in node.children}
        node.untried_actions = [a for a in actions if a not in tried]
        node.is_expanded = True
    
    if not node.untried_actions:
        return node
    
    action = node.untried_actions.pop(0)
    new_state = node.state.apply_action(action)
    child = MCTSNode(new_state, parent=node, action=action)
    node.children.append(child)
    return child
