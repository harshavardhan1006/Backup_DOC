import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Activity, Eye, FlaskConical, BarChart3, Database, Info, ActivitySquare } from 'lucide-react';
import { motion } from 'framer-motion';
import ErrorBoundary from './ErrorBoundary';

const Layout: React.FC = () => {
  const location = useLocation();
  const isVisPage = location.pathname === '/visualization';

  const navItems = [
    { name: 'Home', path: '/', icon: <Activity size={18} /> },
    { name: 'Visualization', path: '/visualization', icon: <Eye size={18} /> },
    { name: 'Experiments', path: '/experiments', icon: <FlaskConical size={18} /> },
    { name: 'Results', path: '/results', icon: <BarChart3 size={18} /> },
    { name: 'Datasets', path: '/datasets', icon: <Database size={18} /> },
    { name: 'About', path: '/about', icon: <Info size={18} /> },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#080816] text-slate-200 font-sans overflow-hidden select-none">
      {/* Fixed-width Sidebar */}
      <aside 
        className="w-[260px] min-w-[260px] max-w-[260px] flex-shrink-0 flex flex-col bg-[#0b0b1e]/90 border-r border-white/10 z-20 backdrop-blur-2xl"
      >
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center gap-3.5 border-b border-white/10 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-purple-500 to-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.4)] flex-shrink-0">
            <ActivitySquare size={22} className="text-white" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-xl font-extrabold tracking-tight title-gradient leading-none">WVCP</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-1">VisualLab</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] group ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,212,255,0.15)] font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`w-5 h-5 flex items-center justify-center transition-colors duration-200 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'}`}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Lab Info */}
        <div className="p-5 border-t border-white/10 flex-shrink-0">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-gray-400">
            <div className="font-semibold text-gray-300 mb-0.5">MCTS & Exact Lab</div>
            <div className="text-[10px] text-gray-500">FastAPI & Python 3.13</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Global Top Header Bar */}
        <header className="h-16 px-8 flex-shrink-0 border-b border-white/10 bg-[#0b0b1e]/60 backdrop-blur-xl flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5 text-sm">
            <span className="font-semibold text-white">WVCP VisualLab</span>
            <span className="text-gray-600">/</span>
            <span className="text-gray-400 text-xs font-normal italic">Weighted Vertex Coloring Problem Environment</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(0,229,160,0.8)] animate-pulse"></span>
              <span>System Online</span>
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className={`flex-1 min-w-0 overflow-hidden ${isVisPage ? 'p-5 lg:p-6' : 'p-6 lg:p-10 overflow-y-auto'}`}>
          <ErrorBoundary fallbackTitle="Page Rendering Error">
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default Layout;
