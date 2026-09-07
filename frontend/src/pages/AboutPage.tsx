import React from 'react';
import { motion } from 'framer-motion';

const AboutPage: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-8 pb-12"
    >
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-10 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]"></div>
        
        <h1 className="text-4xl font-bold text-white mb-4 relative z-10">About WVCP VisualLab</h1>
        <p className="text-lg text-gray-300 relative z-10 leading-relaxed">
          WVCP VisualLab is a premium, high-performance visualization and experimentation platform 
          designed to solve the Weighted Vertex Coloring Problem. It pits traditional brute-force 
          algorithms against advanced Monte Carlo Tree Search (MCTS) strategies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-4">The Problem (WVCP)</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-4">
            The Weighted Vertex Coloring Problem assigns a color to each vertex of a graph such that no two adjacent vertices share the same color. Each vertex has a positive weight, and the weight of a color class is the maximum weight among its vertices.
          </p>
          <div className="bg-gray-900/60 p-4 rounded-xl border border-white/5 font-mono text-center text-cyan-300 text-sm shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
            Minimize: Σ max(w(v)) for v ∈ C_i
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Algorithms</h2>
          <ul className="space-y-4 text-sm">
            <li className="text-gray-400">
              <strong className="text-cyan-400 block mb-1">Exact (Branch & Bound)</strong>
              Guarantees the optimal solution by exhaustively exploring the search space with pruning bounds. Infeasible for large graphs.
            </li>
            <li className="text-gray-400">
              <strong className="text-purple-400 block mb-1">Monte Carlo Tree Search</strong>
              A heuristic search algorithm that balances exploration and exploitation. Enhanced with rollout strategies like DSatur and Greedy.
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-white mb-6">Technology Stack</h2>
        <div className="flex flex-wrap gap-3">
          {['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'Framer Motion', 'React Router', 'Lucide Icons', 'WebSocket'].map(tech => (
            <span key={tech} className="px-4 py-2 bg-gray-900/50 rounded-lg border border-white/10 text-gray-300 text-sm">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AboutPage;
