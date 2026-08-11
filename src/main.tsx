import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "./styles.css";
import "./theme-overrides.css";
import "./github-fidelity.css";
import "./github-fidelity-final.css";
import "./github-screenshot-parity.css";
import "./editor-decoration-bridge.css";
import "./header-tabs.css";
import "./compact-ui-p2.css";
import "./github-readme-p3.css";
import "./unified-responsive-chrome-p4.css";
import "./print.css";

type ErrorBoundaryProps = { children: React.ReactNode };

class AppErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Inkwell renderer error", error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="fatal-error" role="alert">
        <h1>Inkwell could not open.</h1>
        <p>{this.state.error.message || "An unexpected renderer error occurred."}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Reload application
        </button>
      </main>
    );
  }
}

const root = document.getElementById("root");
if (!root) throw new Error("Application root element was not found.");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);
