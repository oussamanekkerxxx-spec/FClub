import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  tabName: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class TabErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="sc-card p-10 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: '#FEE2E2' }}>
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <p className="font-semibold text-navy text-sm mb-1">Something went wrong</p>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4">
            The {this.props.tabName} tab encountered an error.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.setState({ hasError: false })}
            className="inline-flex items-center gap-2 mx-auto">
            <RefreshCw className="w-3.5 h-3.5" /> Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}