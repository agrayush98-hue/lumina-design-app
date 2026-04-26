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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          fontFamily: 'IBM Plex Mono, monospace',
        }}>
          <div style={{
            maxWidth: '500px',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(218, 165, 32, 0.3)',
            borderRadius: '8px',
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px',
            }}>⚠️</div>

            <h2 style={{
              color: '#DAA520',
              fontSize: '24px',
              marginBottom: '16px',
              fontWeight: 'normal',
            }}>
              Something went wrong
            </h2>

            <p style={{
              color: '#999',
              fontSize: '14px',
              marginBottom: '24px',
              lineHeight: '1.6',
            }}>
              The application encountered an unexpected error. This might be due to a network issue or temporary glitch.
            </p>

            {this.state.error && (
              <details style={{
                marginBottom: '24px',
                textAlign: 'left',
                fontSize: '12px',
                color: '#666',
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                  Error details
                </summary>
                <pre style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '12px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '200px',
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleRetry}
              style={{
                backgroundColor: '#DAA520',
                color: '#000',
                border: 'none',
                padding: '12px 32px',
                fontSize: '14px',
                fontFamily: 'IBM Plex Mono, monospace',
                cursor: 'pointer',
                borderRadius: '4px',
                fontWeight: '500',
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#FFD700'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#DAA520'}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
