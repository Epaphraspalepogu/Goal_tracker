import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="size-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold font-display">Something went wrong</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
          </p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            <RefreshCw className="size-4 mr-1" /> Reload Page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
