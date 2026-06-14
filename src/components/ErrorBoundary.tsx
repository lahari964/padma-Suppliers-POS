import React from 'react';

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (error.message.includes('Failed to fetch dynamically imported module')) {
      // Prevent infinite reload loop just in case
      const reloaded = sessionStorage.getItem('chunk_failed_reload');
      if (!reloaded) {
        sessionStorage.setItem('chunk_failed_reload', 'true');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.error?.message.includes('Failed to fetch dynamically imported module')) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p>Applying updates...</p>
            </div>
          </div>
        );
      }

      return (
        <div className="p-10 text-red-500 bg-red-100 min-h-screen">
          <h1 className="text-2xl font-bold mb-4">React Error!</h1>
          <pre className="whitespace-pre-wrap">{this.state.error?.toString()}</pre>
          <pre className="whitespace-pre-wrap mt-4 text-sm">{this.state.error?.stack}</pre>
          <button className="mt-4 px-4 py-2 bg-red-500 text-white rounded" onClick={() => window.location.href = '/'}>Go Home</button>
        </div>
      );
    }
    return this.props.children;
  }
}
