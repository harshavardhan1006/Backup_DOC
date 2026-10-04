// ============================================================
// WVCP VisualLab — TypeScript Type Definitions
// ============================================================

// Graph types
export interface Vertex {
  id: number;
  weight: number;
  x?: number;
  y?: number;
}

export interface Edge {
  source: number;
  target: number;
}

export interface GraphData {
  num_vertices: number;
  weights: number[];
  edges: [number, number][];
  positions?: { x: number; y: number }[];
}

export interface GraphInfo {
  id: string;
  name: string;
  num_vertices: number;
  num_edges: number;
  density: number;
  weight_range: [number, number];
  source: string;
  created_at: string;
  status: string;
}

export interface GraphStats {
  num_vertices: number;
  num_edges: number;
  density: number;
  min_weight: number;
  max_weight: number;
  avg_weight: number;
  min_degree: number;
  max_degree: number;
  avg_degree: number;
  connected_components: number;
}

export interface GraphConfig {
  num_vertices: number;
  edge_probability: number;
  min_weight: number;
  max_weight: number;
  seed?: number;
}

export interface AutoBudget {
  graph_id: string;
  num_vertices: number;
  num_edges: number;
  density?: number;
  iterations: number;
  time_limit: number;
  estimated_runtime_s: number;
  iters_per_sec: number;
  target_seconds: number;
}

// Algorithm types
export type Algorithm = 'exact' | 'mcts';
export type SimulationStrategy = 'random' | 'greedy' | 'dsatur';
export type SolverStatus = 'RUNNING' | 'OPTIMAL' | 'COMPLETED' | 'TIMEOUT' | 'STOPPED' | 'ERROR';

export interface AlgorithmConfig {
  algorithm: Algorithm;
  time_limit: number;
  iterations: number;
  exploration_coeff: number;
  simulation_strategy: SimulationStrategy;
  seed?: number;
}

export interface SolutionResult {
  score: number;
  num_colors: number;
  coloring: Record<string, number>;
  color_classes: Record<number, number[]>;
  max_weights_per_class: Record<number, number>;
  is_optimal: boolean;
  status: SolverStatus;
  runtime: number;
  iterations: number;
  nodes_explored: number;
  nodes_pruned: number;
  simulations: number;
}

// Event types
export type EventType =
  | 'SEARCH_STARTED'
  | 'ITERATION_STARTED'
  | 'NODE_SELECTED'
  | 'NODE_EXPANDED'
  | 'SIMULATION_STARTED'
  | 'SIMULATION_COMPLETED'
  | 'COLOR_ASSIGNED'
  | 'NEW_BEST_SOLUTION'
  | 'BACKPROPAGATION'
  | 'NODE_PRUNED'
  | 'BRANCH_STARTED'
  | 'BRANCH_PRUNED'
  | 'CONFLICT_DETECTED'
  | 'STATE_EXPLORED'
  | 'BEST_SOLUTION_UPDATED'
  | 'SEARCH_PROGRESS'
  | 'SEARCH_COMPLETED'
  | 'SEARCH_TIMEOUT'
  | 'COMPARISON_COMPLETED'
  | 'ERROR';

export interface AlgorithmEvent {
  type: EventType;
  timestamp: number;
  algorithm?: string;
  iteration?: number;
  node_id?: string;
  vertex?: number;
  color?: number;
  score?: number;
  best_score?: number;
  coloring?: Record<string, number>;
  nodes_explored?: number;
  nodes_pruned?: number;
  simulations?: number;
  elapsed?: number;
  data?: Record<string, any>;
  message?: string;
  // Exact-specific
  states_explored?: number;
  branches_pruned?: number;
  current_score?: number;
  depth?: number;
  total_depth?: number;
  num_colors?: number;
  is_optimal?: boolean;
  runtime?: number;
  // MCTS tree node data
  tree_node?: MCTSTreeNode;
}

// MCTS Tree visualization
export interface MCTSTreeNode {
  id: string;
  depth: number;
  visits: number;
  avg_reward: number;
  best_score: number;
  num_children: number;
  is_pruned: boolean;
  action?: number;
  parent_id?: string;
  children?: MCTSTreeNode[];
}

// Experiment types
export interface ExperimentConfig {
  graph_sizes: number[];
  algorithms: AlgorithmConfig[];
  edge_probability: number;
  min_weight: number;
  max_weight: number;
  time_limit: number;
  iterations: number;
  num_repetitions: number;
  seed: number;
}

export interface ExperimentResult {
  experiment_id: string;
  timestamp: string;
  graph_id: string;
  graph_size: number;
  edge_count: number;
  density: number;
  algorithm: string;
  simulation_strategy: string;
  iterations: number;
  time_limit: number;
  exploration_coeff: number;
  seed: number;
  runtime: number;
  status: string;
  score: number;
  num_colors: number;
  nodes_explored: number;
  nodes_pruned: number;
  simulations: number;
  optimality_gap?: number;
  speedup?: number;
}

export interface ComparisonResult {
  graph_info: GraphInfo;
  results: Record<string, SolutionResult>;
}

// Visualization modes
export type VisualizationMode = 'detailed' | 'focused' | 'overview';

// Live metrics
export interface LiveMetrics {
  iteration: number;
  bestScore: number;
  currentScore: number;
  nodesCreated: number;
  nodesExplored: number;
  nodesPruned: number;
  simulations: number;
  elapsedTime: number;
  numColors: number;
  status: SolverStatus;
  strategy?: SimulationStrategy;
  scoreHistory: { iteration: number; score: number }[];
}

// Import result
export interface ImportResult {
  is_valid: boolean;
  format: string;
  errors: string[];
  warnings: string[];
  stats: {
    vertices: number;
    edges: number;
  };
  graph_id?: string;
  graph_info?: GraphInfo;
  status?: string;
}

// Preset info
export interface PresetInfo {
  name: string;
  description: string;
  vertices: number;
  edges: number;
}

// Color palette for graph coloring
export const GRAPH_COLORS = [
  '#00D4FF', // cyan
  '#FF6B6B', // red
  '#51CF66', // green
  '#FFD43B', // yellow
  '#CC5DE8', // purple
  '#FF922B', // orange
  '#20C997', // teal
  '#F06595', // pink
  '#748FFC', // blue
  '#FCC419', // amber
  '#38D9A9', // mint
  '#E599F7', // lavender
  '#69DB7C', // light green
  '#FF8787', // coral
  '#74C0FC', // sky
  '#FAB005', // gold
];

// Node visual states
export type NodeState = 
  | 'uncolored' 
  | 'processing' 
  | 'colored' 
  | 'selected' 
  | 'best' 
  | 'conflict';
