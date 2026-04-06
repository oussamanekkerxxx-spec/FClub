import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  tabName: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
}

export class TabErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[TabErrorBoundary] Error in ${this.props.tabName}:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="sc-card p-10 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-500" />
          <h3 className="font-semibold text-navy mb-1">
            Something went wrong loading {this.props.tabName}
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4">
            An unexpected error occurred. Your data is safe.
          </p>
          <button onClick={this.handleRetry} className="btn-amber text-sm">
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
