import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  Eye,
  FlaskConical,
  BarChart3,
  Database,
  Info,
  ActivitySquare,
  Menu,
  X,
} from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

const Layout: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: 'Home', path: '/', icon: <Activity size={18} /> },
    { name: 'Visualization', path: '/visualization', icon: <Eye size={18} /> },
    { name: 'Experiments', path: '/experiments', icon: <FlaskConical size={18} /> },
    { name: 'Results', path: '/results', icon: <BarChart3 size={18} /> },
    { name: 'Datasets', path: '/datasets', icon: <Database size={18} /> },
    { name: 'About', path: '/about', icon: <Info size={18} /> },
  ];

  const renderNavLinks = () => (
    <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 group ${
              isActive
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shadow-[0_0_15px_rgba(0,212,255,0.12)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`w-5 h-5 flex items-center justify-center shrink-0 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'
                }`}
              >
                {item.icon}
              </span>
              <span className="truncate">{item.name}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen w-full bg-[#080816] text-slate-200 font-sans flex flex-col lg:flex-row overflow-x-hidden">
      {/* Desktop / Tablet Sticky Sidebar (lg and up) */}
      <aside className="hidden lg:flex lg:w-[230px] xl:w-[256px] shrink-0 flex-col bg-[#0b0b1e]/95 border-r border-white/10 sticky top-0 h-screen z-30">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center gap-3.5 border-b border-white/10 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-purple-500 to-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.3)] shrink-0">
            <ActivitySquare size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold tracking-tight title-gradient leading-none">
              WVCP
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">
              VisualLab
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        {renderNavLinks()}

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-200">WVCP Research Platform</div>
            <div className="text-[11px] font-mono text-slate-500">Exact B&amp;B • MCTS UCT</div>
          </div>
        </div>
      </aside>

      {/* Mobile / Tablet Drawer Overlay (< lg) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-[260px] max-w-[80vw] bg-[#0b0b1e] border-r border-white/15 h-full flex flex-col z-10 shadow-2xl">
            <div className="h-16 px-5 flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-purple-500 to-emerald-400 flex items-center justify-center">
                  <ActivitySquare size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-extrabold tracking-tight title-gradient leading-none">
                    WVCP
                  </h1>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">
                    VisualLab
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close navigation menu"
              >
                <X size={18} />
              </button>
            </div>
            {renderNavLinks()}
            <div className="p-4 border-t border-white/10 shrink-0">
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-200">WVCP Research Platform</div>
                <div className="text-[11px] font-mono text-slate-500">Exact B&amp;B • MCTS UCT</div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area — Scrolls Naturally with the Page */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Sticky Top Header Bar */}
        <header className="h-16 px-4 sm:px-6 lg:px-8 shrink-0 border-b border-white/10 bg-[#0b0b1e]/85 backdrop-blur-xl flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2.5 text-sm min-w-0">
              <span className="font-semibold text-white truncate">WVCP VisualLab</span>
              <span className="text-slate-600 hidden md:inline">/</span>
              <span className="text-slate-400 text-xs font-normal hidden md:inline truncate">
                Weighted Vertex Coloring Problem — Experimentation &amp; Visualization Environment
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Engine Ready</span>
            </div>
          </div>
        </header>

        {/* Page Content Container — Natural Vertical Flow */}
        <main className="flex-1 min-w-0 w-full p-4 sm:p-6 lg:p-8">
          <ErrorBoundary fallbackTitle="Page Rendering Error">
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default Layout;
