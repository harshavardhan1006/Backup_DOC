import React from 'react';
import { Zap, GitFork, Cpu, Layers, CheckCircle2, Scale, Code2 } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-8 pb-14">
      {/* 1. ABOUT WVCP VISUALLAB — INTRODUCTION */}
      <section className="bg-[#0b0b1e]/90 border border-white/10 rounded-2xl p-6 sm:p-8 lg:p-10 relative overflow-hidden shadow-xl">
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-cyan-500/[0.07] rounded-full blur-[90px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-mono uppercase tracking-wider mb-4">
          Research Documentation &amp; Methodology
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 relative z-10">
          About WVCP VisualLab
        </h1>
        <p className="text-base text-slate-300 relative z-10 leading-relaxed max-w-4xl">
          WVCP VisualLab is a visualization and experimentation platform for the Weighted Vertex
          Coloring Problem. It evaluates exact Branch-and-Bound search alongside Monte Carlo Tree
          Search (MCTS) strategies to study solution quality, search behavior, and scalability
          across graph instances.
        </p>
      </section>

      {/* 2. THE WEIGHTED VERTEX COLORING PROBLEM */}
      <section className="bg-[#0b0b1e]/90 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-lg">
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-lg font-semibold uppercase tracking-wider text-white flex items-center gap-2.5">
            <Layers size={18} className="text-cyan-400" /> The Weighted Vertex Coloring Problem (WVCP)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Formal combinatorial definition and objective function
          </p>
        </div>

        <div className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
          <p>
            Given an undirected weighted graph{' '}
            <span className="font-mono text-white">G = (V, E, w)</span> where each vertex{' '}
            <span className="font-mono text-white">v ∈ V</span> is assigned a positive integer
            weight <span className="font-mono text-white">w(v) &gt; 0</span>, the Weighted Vertex
            Coloring Problem requires partitioning the vertex set{' '}
            <span className="font-mono text-white">V</span> into{' '}
            <span className="font-mono text-white">k</span> pairwise disjoint independent sets
            (color classes) <span className="font-mono text-white">C₁, C₂, …, Cₖ</span> such that no
            two adjacent vertices share the same color class:
          </p>
          <p className="text-slate-400">
            Unlike classical graph coloring—which minimizes the cardinality{' '}
            <span className="font-mono text-slate-200">k</span> of color classes—WVCP weights each
            color class <span className="font-mono text-slate-200">Cᵢ</span> by the heaviest vertex
            contained in <span className="font-mono text-slate-200">Cᵢ</span>. The objective is to
            minimize the total weight across all active color classes:
          </p>
        </div>

        <div className="bg-black/50 p-5 rounded-xl border border-cyan-500/25 font-mono text-center text-cyan-300 text-sm sm:text-base">
          Minimize &nbsp; f(C₁, …, Cₖ) = Σᵢ₌₁..ₖ max_{'{v ∈ Cᵢ}'} w(v) &nbsp;&nbsp; subject to
          &nbsp;&nbsp; (u, v) ∈ E ⇒ c(u) ≠ c(v)
        </div>
      </section>

      {/* 3. RESEARCH EVALUATION SCOPE */}
      <section className="bg-[#0b0b1e]/90 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-lg">
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-lg font-semibold uppercase tracking-wider text-white flex items-center gap-2.5">
            <Scale size={18} className="text-emerald-400" /> Research Evaluation Scope
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Empirical methodology for comparing exact and heuristic solvers across graph scales
          </p>
        </div>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Because WVCP generalizes the classical NP-hard vertex coloring problem, exact search is
          computationally feasible only on small-to-moderate instances, while heuristic tree search
          enables exploration on much larger graphs. WVCP VisualLab is structured around three core
          experimental workflows:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
          <div className="p-5 rounded-xl bg-black/35 border border-white/10 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>1. Optimality Baseline</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Execute Exact Branch-and-Bound on small benchmark instances to establish proven
              optimal objective values and quantify the optimality gap of MCTS configurations.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-black/35 border border-white/10 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>2. Rollout Policy Analysis</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Evaluate how Uniform Random, Greedy (minimum marginal cost), and DSATUR simulation
              rollout policies influence MCTS convergence rate and final WVCP score.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-black/35 border border-white/10 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>3. Large-Scale Scalability</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Study iteration throughput, incremental lower-bound pruning, and solution quality on
              large instances (10K–50K+ vertices) using calibrated computation budgets.
            </p>
          </div>
        </div>
      </section>

      {/* 4. IMPLEMENTED ALGORITHMS */}
      <section className="bg-[#0b0b1e]/90 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-lg">
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-lg font-semibold uppercase tracking-wider text-white flex items-center gap-2.5">
            <GitFork size={18} className="text-purple-400" /> Implemented Algorithms
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Detailed architecture of the exact baseline solver and heuristic MCTS engine
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Exact (Branch & Bound) */}
          <div className="p-6 rounded-xl bg-black/35 border border-red-500/25 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
                  <Zap size={16} /> Exact (Branch &amp; Bound)
                </h3>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-red-500/15 text-red-300 border border-red-500/30">
                  Exact Search
                </span>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                Performs systematic depth-first Branch-and-Bound tree search over valid color
                assignments to establish an exact optimal baseline when computationally feasible.
              </p>

              <ul className="space-y-2.5 text-sm text-slate-300 list-disc list-inside leading-relaxed">
                <li>
                  <strong className="text-white">Exact Search &amp; Symmetry Breaking:</strong>{' '}
                  Orders vertices by descending weight and branches on valid existing color classes
                  plus at most one new color class per step.
                </li>
                <li>
                  <strong className="text-white">Lower-Bound Pruning:</strong> Prunes search
                  subtrees immediately whenever the partial WVCP objective meets or exceeds the
                  best incumbent upper bound.
                </li>
                <li>
                  <strong className="text-white">Optimal Baseline:</strong> Guarantees global
                  optimality upon completion; serves as the ground-truth baseline on small graphs.
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-white/10 text-xs font-mono text-slate-400 flex justify-between">
              <span>Output Guarantee:</span>
              <span className="text-emerald-400">Provably Optimal (if completed)</span>
            </div>
          </div>

          {/* Monte Carlo Tree Search */}
          <div className="p-6 rounded-xl bg-black/35 border border-cyan-500/25 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                  <Cpu size={16} /> Monte Carlo Tree Search (MCTS)
                </h3>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Heuristic Search
                </span>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                Guides heuristic tree search over partial colorings using UCB1/UCT selection,
                structural delta-state sharing, and rollout simulations. Does not inherently
                guarantee global optimality.
              </p>

              <ul className="space-y-2.5 text-sm text-slate-300 list-disc list-inside leading-relaxed">
                <li>
                  <strong className="text-white">Exploration / Exploitation:</strong> Uses UCB1
                  tree policy with configurable exploration weight and incremental partial-score
                  subtree pruning.
                </li>
                <li>
                  <strong className="text-white">Rollout Strategies:</strong> Supports{' '}
                  <span className="font-mono text-purple-300">DSATUR</span>,{' '}
                  <span className="font-mono text-cyan-300">Greedy</span> (minimum marginal weight
                  increase), and <span className="font-mono text-amber-300">Uniform Random</span>{' '}
                  simulation policies.
                </li>
                <li>
                  <strong className="text-white">Scalability &amp; Auto-Budget:</strong> Uses O(1)
                  delta-state structural sharing and calibrates iteration budgets to measured
                  rollout speed.
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-white/10 text-xs font-mono text-slate-400 flex justify-between">
              <span>Output Guarantee:</span>
              <span className="text-cyan-300">Best Valid Heuristic Solution Found</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TECHNOLOGY STACK */}
      <section className="bg-[#0b0b1e]/90 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-lg">
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-lg font-semibold uppercase tracking-wider text-white flex items-center gap-2.5">
            <Code2 size={18} className="text-cyan-400" /> Technology Stack
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Frontend visualization and backend solver telemetry stack
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            'React 19',
            'TypeScript',
            'Vite',
            'Tailwind CSS',
            'D3.js Force & Hierarchy',
            'Recharts',
            'Framer Motion',
            'React Router',
            'Lucide Icons',
            'FastAPI & WebSocket Telemetry',
          ].map((tech) => (
            <span
              key={tech}
              className="px-4 py-2 bg-black/45 rounded-xl border border-white/10 text-slate-200 text-xs sm:text-sm font-mono"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
