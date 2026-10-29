import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-wrapper container" role="alert">
          <div className="error-boundary-card glass shadow-lg">
            <div className="error-boundary-icon-wrap" aria-hidden="true">
              <AlertTriangle size={36} className="text-warning" />
            </div>
            <h2>Something went wrong in this section</h2>
            <p className="error-boundary-desc">
              We encountered an unexpected problem loading this feature. Your other data remains safe.
            </p>
            {this.state.error?.message && (
              <pre className="error-boundary-detail">
                {this.state.error.message}
              </pre>
            )}
            <div className="error-boundary-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={this.handleReset}
              >
                <RotateCcw size={16} />
                Try again
              </button>
              <a href="/" className="btn btn-outline">
                <Home size={16} />
                Back to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

