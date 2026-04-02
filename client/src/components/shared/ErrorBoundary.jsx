import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 24,
          background: '#111a2e',
          border: '1px solid #1e2d4a',
          borderRadius: 6,
          color: '#e2e8f0',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          margin: 8,
        }}>
          <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: 8, letterSpacing: '0.1em' }}>
            COMPONENT ERROR
          </div>
          <div style={{ color: '#7a8ba8' }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
