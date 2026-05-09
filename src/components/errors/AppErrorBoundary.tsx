import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { reportError } from '@/lib/errors';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AppErrorBoundary] Uncaught error:', error, errorInfo);
    reportError('app-error-boundary', error, { componentStack: errorInfo.componentStack });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-parchment)' }}>
          <div className="max-w-md w-full sc-card-warm p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center bg-red-50">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            <h1 className="font-heading text-xl font-bold text-navy mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
              An unexpected error occurred. Your data is safe and nothing has been lost.
              Try reloading the page or go back home.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 rounded-lg bg-red-50/50 border border-red-100 text-left">
                <p className="text-xs font-mono text-red-700 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="btn-amber inline-flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reload Page
              </button>

              <Link
                to="/app/discover"
                onClick={this.handleReset}
                className="btn-navy inline-flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Link>
            </div>

            <p className="mt-6 text-[11px] text-[var(--color-text-muted)]">
              If this keeps happening, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
