import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[400px] flex items-center justify-center p-6 select-text">
          <div className="max-w-xl w-full bg-[#0d0d24] border border-red-500/30 rounded-2xl p-6 md:p-8 shadow-[0_0_30px_rgba(255,107,107,0.15)] backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {this.props.fallbackTitle || 'Component Execution Error'}
                </h2>
                <p className="text-xs text-red-300">
                  The visualizer encountered an unhandled exception and safely halted.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="mb-5 p-3 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-red-200 overflow-x-auto max-h-40">
                <p className="font-semibold text-red-400">{this.state.error.name}: {this.state.error.message}</p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-2 text-[10px] text-gray-400 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <RefreshCw size={14} />
                <span>Try Again</span>
              </button>
              <button
                onClick={this.handleReload}
                className="btn btn-ghost text-xs py-2 px-4 border-white/20 text-gray-300 hover:text-white"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn btn-ghost text-xs py-2 px-4 border-white/20 text-gray-300 hover:text-white flex items-center gap-1.5"
              >
                <Home size={14} />
                <span>Return Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
