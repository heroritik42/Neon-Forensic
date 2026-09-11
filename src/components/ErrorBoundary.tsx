import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertOctagon, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Forensic Interface Error Boundary caught exception:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6 font-mono-forensic">
          <div className="max-w-xl w-full p-6 rounded-xl bg-[#0b0f19] border border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.2)] text-left">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertOctagon className="w-8 h-8" />
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  Interface View Safeguard Triggered
                </h2>
                <p className="text-xs text-rose-300/80">
                  Recovered from view rendering fault. System data &amp; evidence vault remain secure.
                </p>
              </div>
            </div>

            <div className="p-3 my-4 rounded bg-black/60 border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto max-h-36">
              <div className="text-rose-400 font-semibold mb-1">
                {this.state.error?.name || "Error"}: {this.state.error?.message || "Unknown rendering exception"}
              </div>
              {this.state.error?.stack && (
                <div className="text-[11px] text-slate-500 whitespace-pre-wrap">
                  {this.state.error.stack.split("\n").slice(0, 4).join("\n")}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload View
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.hash = "";
                }}
                className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs flex items-center gap-2 transition-colors"
              >
                <Home className="w-3.5 h-3.5 text-slate-400" />
                Return to Overview
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
