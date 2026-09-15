import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Logged so it at least shows up in the browser console / any error
    // reporting tool, instead of failing completely silently.
    console.error('Unhandled error caught by ErrorBoundary:', error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '60vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: 32, fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>😕</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A0A12', marginBottom: 8, fontFamily: 'Baloo 2, sans-serif' }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: 14, color: '#8A7A87', marginBottom: 24, maxWidth: 380 }}>
          This page hit an unexpected error. It's not you — please try reloading, or head back home.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 22px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#E91E8C,#B5006E)', color: '#fff',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            🔄 Reload Page
          </button>
          <button
            onClick={() => { window.location.href = '/'; }}
            style={{
              padding: '12px 22px', borderRadius: 10, border: '1.5px solid #EFE1E7',
              background: '#fff', color: '#2B1330', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            🏠 Go to Home
          </button>
        </div>
      </div>
    );
  }
}
