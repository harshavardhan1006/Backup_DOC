from algorithms.mcts.node import MCTSNode

def backpropagate(node: MCTSNode, score: float):
    """Backpropagate the simulation result up the tree."""
    current = node
    reward = 1.0 / (1.0 + score)  # Convert minimization score to reward
    while current is not None:
        current.visits += 1
        current.total_reward += reward
        if score < current.best_score:
            current.best_score = score
        current = current.parent
