import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI Crash:", error);
    console.error("Component Stack:", errorInfo);

    // Future-ready:
    // sendToMonitoring(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "32px",
            background: "#111",
            color: "#fff",
            minHeight: "100vh",
            fontFamily: "system-ui",
          }}
        >
          <h1 style={{ color: "#ff5252" }}>Something went wrong</h1>
          <p>
            The application encountered an unexpected error.
          </p>

          <details style={{ marginTop: "16px", color: "#bbb" }}>
            <summary>Technical details</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {this.state.error?.toString()}
            </pre>
          </details>

          <button
            style={{
              marginTop: "24px",
              padding: "10px 16px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
