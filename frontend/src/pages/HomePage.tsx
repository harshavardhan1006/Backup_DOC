import React from 'react';
import { motion } from 'framer-motion';
import { Network, Database, Zap, LineChart, ChevronRight, Sparkles, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const actionCards = [
    {
      title: "Interactive Visualizer",
      description: "Step-by-step D3 force graph coloring with MCTS tree exploration.",
      icon: <Network className="w-6 h-6 text-cyan-400" />,
      path: "/visualization",
      color: "from-cyan-500/20 to-blue-500/5",
      border: "border-cyan-500/30",
      accent: "text-cyan-400",
    },
    {
      title: "Dataset Catalog",
      description: "Manage DIMACS benchmarks, custom CSV/JSON, and preset instances.",
      icon: <Database className="w-6 h-6 text-purple-400" />,
      path: "/datasets",
      color: "from-purple-500/20 to-pink-500/5",
      border: "border-purple-500/30",
      accent: "text-purple-400",
    },
    {
      title: "Algorithm Comparison",
      description: "Direct side-by-side run of Exact Branch & Bound vs MCTS strategies.",
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      path: "/visualization",
      color: "from-amber-500/20 to-yellow-500/5",
      border: "border-amber-500/30",
      accent: "text-amber-400",
    },
    {
      title: "Scalability Matrix",
      description: "Automated empirical benchmarks across graph sizes with live charts.",
      icon: <LineChart className="w-6 h-6 text-emerald-400" />,
      path: "/experiments",
      color: "from-emerald-500/20 to-teal-500/5",
      border: "border-emerald-500/30",
      accent: "text-emerald-400",
    }
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-12">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 backdrop-blur-xl p-8 md:p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-purple-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold w-fit">
            <Sparkles size={14} /> Next-Gen Combinatorial Optimization
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            <span className="title-gradient">WVCP</span> VisualLab
          </h1>

          <p className="text-base text-slate-300 font-normal leading-relaxed">
            High-performance research laboratory for the Weighted Vertex Coloring Problem. 
            Investigating exact branch-and-bound pruning versus Monte Carlo Tree Search (MCTS) 
            with Random, Greedy, and DSatur simulation rollouts.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button 
              onClick={() => navigate('/visualization')}
              className="btn btn-primary px-6 py-3 text-sm shadow-[0_0_20px_rgba(0,212,255,0.25)]"
            >
              <span>Launch Visualizer</span>
              <ChevronRight size={16} />
            </button>

            <button 
              onClick={() => navigate('/experiments')}
              className="btn btn-ghost px-6 py-3 text-sm border-white/15 hover:border-white/30"
            >
              <span>Scalability Lab</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Zap size={18} className="text-cyan-400" /> Research Modules
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {actionCards.map((card, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -4 }}
              onClick={() => navigate(card.path)}
              className={`cursor-pointer p-6 rounded-2xl bg-gradient-to-br ${card.color} border ${card.border} backdrop-blur-md transition-all flex flex-col justify-between gap-4 group shadow-lg`}
            >
              <div className="p-3 bg-black/40 rounded-xl w-fit group-hover:scale-110 transition-transform border border-white/5">
                {card.icon}
              </div>

              <div>
                <h3 className="text-base font-semibold text-white mb-1.5">{card.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{card.description}</p>
              </div>

              <div className={`text-xs font-semibold flex items-center gap-1 ${card.accent} mt-2`}>
                <span>Explore</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Architecture Specs */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Algorithm Matrix</h3>
            <span className="text-xs text-slate-400">Available Solvers</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-black/30 border border-white/5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-red-400">Exact Solver</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-300 font-mono">B&B</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Branch-and-bound tree exploration with symmetric color pruning and weight-descending sorting for tight lower bounds.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/30 border border-white/5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-cyan-400">MCTS Engine</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono">UCT</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Monte Carlo tree search balancing exploitation with exploration, utilizing DSatur, Greedy, and Random rollout heuristics.
              </p>
            </div>
          </div>
        </div>

        {/* Problem Formulation Card */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white mb-2">WVCP Formulation</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Objective: Partition graph vertices into independent color sets minimizing total class weight:
            </p>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-center text-xs text-cyan-300">
              min Σ max_{"{v ∈ c}"} w(v)
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Graph Support</span>
            <span className="text-emerald-400 font-medium">Up to 200+ Vertices</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
