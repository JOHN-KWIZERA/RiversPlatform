import { Component } from 'react';

// Catches render/runtime errors in the tree below so a single broken page
// shows a readable message instead of blanking the whole app.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Caught by ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
          <div className="max-w-lg w-full bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <h1 className="text-lg font-black text-[#001E2B]">Something went wrong</h1>
            <p className="text-sm text-gray-500 mt-2">This page hit an error and couldn't render.</p>
            <pre className="text-left text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg p-3 mt-4 overflow-auto whitespace-pre-wrap">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <div className="flex gap-2 justify-center mt-5">
              <button
                onClick={() => { this.setState({ error: null }); }}
                className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Try again
              </button>
              <button
                onClick={() => { window.location.href = '/dashboard'; }}
                className="px-4 py-2 text-sm font-bold text-white bg-[#001E2B] rounded-xl hover:bg-[#002d42]"
              >
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
