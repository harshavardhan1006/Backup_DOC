import React from 'react';
import {
  Network,
  Database,
  Zap,
  LineChart,
  ChevronRight,
  FlaskConical,
  GitCompare,
  Cpu,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const researchModules = [
    {
      title: 'Interactive Visualizer',
      description:
        'Inspect graph structure, representative subgraphs for large instances, live coloring assignments, and MCTS convergence curves.',
      icon: <Network className="w-6 h-6 text-cyan-400" />,
      path: '/visualization',
      color: 'from-cyan-500/15 to-blue-500/[0.03]',
      border: 'border-cyan-500/30 hover:border-cyan-400/50',
      accent: 'text-cyan-400',
      tag: 'MODULE 01',
    },
    {
      title: 'Dataset Catalog',
      description:
        'Manage small interactive demonstration presets alongside generated and imported research instances (CSV, JSON, edge-list TXT).',
      icon: <Database className="w-6 h-6 text-purple-400" />,
      path: '/datasets',
      color: 'from-purple-500/15 to-indigo-500/[0.03]',
      border: 'border-purple-500/30 hover:border-purple-400/50',
      accent: 'text-purple-400',
      tag: 'MODULE 02',
    },
    {
      title: 'Algorithm Comparison',
      description:
        'Compare exact Branch-and-Bound search with MCTS-based heuristic strategies to evaluate optimality gap and runtime trade-offs.',
      icon: <GitCompare className="w-6 h-6 text-amber-400" />,
      path: '/visualization',
      color: 'from-amber-500/15 to-yellow-500/[0.03]',
      border: 'border-amber-500/30 hover:border-amber-400/50',
      accent: 'text-amber-400',
      tag: 'MODULE 03',
    },
    {
      title: 'Scalability Matrix',
      description:
        'Execute empirical scalability benchmarks across varying vertex counts and edge densities with automated budget calibration.',
      icon: <LineChart className="w-6 h-6 text-emerald-400" />,
      path: '/experiments',
      color: 'from-emerald-500/15 to-teal-500/[0.03]',
      border: 'border-emerald-500/30 hover:border-emerald-400/50',
      accent: 'text-emerald-400',
      tag: 'MODULE 04',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col gap-8 pb-12">
      {/* 1. HERO SECTION */}
      <section className="relative rounded-2xl bg-gradient-to-b from-[#11112a] to-[#0b0b1e] border border-white/10 p-6 sm:p-8 lg:p-10 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-[380px] h-[380px] bg-cyan-500/[0.07] rounded-full blur-[110px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[380px] h-[380px] bg-purple-500/[0.07] rounded-full blur-[110px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-8 items-center">
          <div className="xl:col-span-8 flex flex-col gap-4 min-w-0">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-mono uppercase tracking-wider w-fit">
              <FlaskConical size={14} /> Combinatorial Optimization Research Platform
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              <span className="title-gradient">WVCP</span> VisualLab
            </h1>

            <p className="text-base text-slate-300 font-normal leading-relaxed max-w-3xl">
              A research visualization and experimentation platform for the{' '}
              <strong className="text-white font-semibold">Weighted Vertex Coloring Problem</strong>.
              Compare exact Branch-and-Bound search with MCTS-based heuristic strategies (Random,
              Greedy, and DSATUR) to evaluate solution quality, search behavior, and scalability
              across graph instances.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => navigate('/visualization')}
                className="btn btn-primary px-6 py-3 text-sm"
              >
                <span>Open Visualization Lab</span>
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => navigate('/experiments')}
                className="btn px-5 py-3 text-sm bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/15"
              >
                <span>Scalability Matrix</span>
              </button>

              <button
                onClick={() => navigate('/datasets')}
                className="btn px-5 py-3 text-sm bg-transparent hover:bg-white/[0.05] text-slate-300 border border-white/10"
              >
                <span>Dataset Catalog</span>
              </button>
            </div>
          </div>

          {/* Platform Capabilities Box */}
          <div className="xl:col-span-4 w-full rounded-xl bg-black/45 border border-white/10 p-5 sm:p-6 space-y-3 text-sm">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold border-b border-white/10 pb-2.5 flex items-center justify-between">
              <span>Platform Capabilities</span>
              <Cpu size={15} />
            </div>
            <div className="flex justify-between items-center gap-2 text-slate-400 py-1 border-b border-white/5">
              <span>Exact Baseline:</span>
              <span className="font-mono text-slate-200 font-medium">Branch &amp; Bound</span>
            </div>
            <div className="flex justify-between items-center gap-2 text-slate-400 py-1 border-b border-white/5">
              <span>Heuristic Search:</span>
              <span className="font-mono text-slate-200 font-medium">MCTS (UCB1 / UCT)</span>
            </div>
            <div className="flex justify-between items-center gap-2 text-slate-400 py-1 border-b border-white/5">
              <span>Rollout Policies:</span>
              <span className="font-mono text-purple-300 font-medium">DSATUR, Greedy, Random</span>
            </div>
            <div className="flex justify-between items-center gap-2 text-slate-400 pt-1">
              <span>Instance Scale:</span>
              <span className="font-mono text-emerald-300 font-medium">5V Demo – 50K+ V</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. RESEARCH MODULES SECTION */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base sm:text-lg font-semibold uppercase tracking-wider text-white flex items-center gap-2">
            <Zap size={18} className="text-cyan-400" /> Research Modules
          </h2>
          <span className="text-xs text-slate-400 font-mono">4 Integrated Environments</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {researchModules.map((card, idx) => (
            <div
              key={idx}
              onClick={() => navigate(card.path)}
              className={`cursor-pointer p-6 rounded-2xl bg-gradient-to-br ${card.color} border ${card.border} transition-all flex flex-col justify-between gap-5 group hover:-translate-y-0.5 shadow-lg`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-black/45 rounded-xl border border-white/10">
                    {card.icon}
                  </div>
                  <span className="text-xs font-mono text-slate-400 tracking-wider">
                    {card.tag}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-white mb-2">{card.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{card.description}</p>
              </div>

              <div
                className={`text-xs font-semibold flex items-center gap-1.5 ${card.accent} pt-3 border-t border-white/10`}
              >
                <span>Open Module</span>
                <ChevronRight
                  size={15}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. ALGORITHM MATRIX SECTION */}
      <section className="p-6 sm:p-8 rounded-2xl bg-[#0b0b1e]/90 border border-white/10 flex flex-col gap-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold uppercase tracking-wider text-white">
              Algorithm Matrix
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Comparative evaluation of exact Branch-and-Bound search versus MCTS-based heuristic search
            </p>
          </div>
          <span className="text-xs font-mono text-slate-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            Exact Baseline vs. Heuristic Search
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Exact Solver Card */}
          <div className="p-6 rounded-xl bg-black/35 border border-red-500/25 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-base text-red-400">Exact Solver</span>
                <span className="text-xs px-2.5 py-1 rounded bg-red-500/15 text-red-300 border border-red-500/30 font-mono">
                  Branch &amp; Bound
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Branch-and-Bound exact search
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Explores the coloring state space systematically using weight-descending vertex
                ordering, symmetry breaking, and partial-score lower-bound pruning to establish
                provably optimal solutions on tractable instances.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2 font-mono">
              <span>Optimality Guarantee:</span>
              <span className="text-emerald-400 font-semibold">Optimal baseline (when feasible)</span>
            </div>
          </div>

          {/* MCTS Engine Card */}
          <div className="p-6 rounded-xl bg-black/35 border border-cyan-500/25 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-base text-cyan-400">MCTS Engine</span>
                <span className="text-xs px-2.5 py-1 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                  UCT + Rollouts
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Monte Carlo Tree Search with rollout strategies
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Guides heuristic tree search balancing exploration and exploitation via UCB1, paired
                with DSATUR, Greedy, or Random rollouts, delta-state memory sharing, and incremental
                lower-bound subtree pruning.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2 font-mono">
              <span>Search Role:</span>
              <span className="text-cyan-300 font-semibold">Scalable heuristic (non-exact)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WVCP FORMULATION & PLATFORM INFORMATION SECTION */}
      <section className="p-6 sm:p-8 rounded-2xl bg-[#0b0b1e]/90 border border-white/10 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <Layers size={18} className="text-purple-400" /> WVCP Formulation &amp; Problem Structure
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Mathematical objective and combinatorial constraints evaluated by the platform
            </p>
          </div>
          <span className="text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/25 px-3 py-1 rounded-lg">
            Complexity Class: NP-Hard
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              Given an undirected vertex-weighted graph{' '}
              <span className="font-mono text-white">G = (V, E, w)</span> with positive vertex
              weights <span className="font-mono text-white">w(v) &gt; 0</span>, partition{' '}
              <span className="font-mono text-white">V</span> into{' '}
              <span className="font-mono text-white">k</span> independent color classes{' '}
              <span className="font-mono text-white">C₁, C₂, …, Cₖ</span> such that no two adjacent
              vertices share the same color (<span className="font-mono text-white">(u, v) ∈ E ⇒ c(u) ≠ c(v)</span>).
            </p>
            <p className="text-slate-400">
              Each color class <span className="font-mono text-slate-200">Cᵢ</span> incurs a cost
              equal to the maximum weight among its assigned vertices, and the objective is to
              minimize the sum of maximum weights across all active color classes.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="p-5 rounded-xl bg-black/50 border border-cyan-500/25 font-mono text-center text-sm sm:text-base text-cyan-300">
              min &nbsp; Σᵢ₌₁..ₖ &nbsp; max_{'{v ∈ Cᵢ}'} w(v)
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-black/35 border border-white/5 flex flex-col gap-1">
                <span className="text-slate-400">Demo Presets</span>
                <span className="text-white font-semibold">5V – 25V (Full Render)</span>
              </div>
              <div className="p-3 rounded-lg bg-black/35 border border-white/5 flex flex-col gap-1">
                <span className="text-slate-400">Research Scale</span>
                <span className="text-emerald-400 font-semibold">10K – 50K+ V (Sampled Viz)</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
