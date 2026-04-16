import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 p-4 text-center">
          <div className="bg-white dark:bg-white/5 p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl max-w-md">
            <h1 className="text-4xl font-black text-rose-600 mb-4">Oops!</h1>
            <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              The page crashed due to an unexpected error. Try refreshing or going back to the home page.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-white/20 transition-all"
              >
                Go Home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-6 p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs text-left rounded-xl overflow-auto max-h-40">
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
