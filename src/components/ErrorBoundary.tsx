import React from 'react';

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
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
