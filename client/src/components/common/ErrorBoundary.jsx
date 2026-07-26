import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-charcoal-900 border border-gold-500/30 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-500">
              <FiAlertTriangle className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <h1 className="text-2xl font-serif font-bold text-gold-400 mb-2">StyleVerse Luxury</h1>
              <h2 className="text-lg font-bold text-white mb-2">Something went wrong</h2>
              <p className="text-xs text-gray-400 mb-3">
                An unexpected error occurred while loading this view. Please reload or return to the homepage.
              </p>
              {this.state.error && (
                <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-xl text-left text-[11px] font-mono text-red-300 overflow-x-auto max-h-32">
                  {this.state.error.toString()}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-gold-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-gold-400 transition cursor-pointer"
              >
                <FiRefreshCw className="w-4 h-4" /> Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 py-3 px-4 rounded-xl bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-white/20 transition cursor-pointer"
              >
                <FiHome className="w-4 h-4" /> Homepage
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
