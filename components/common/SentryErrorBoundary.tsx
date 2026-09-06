'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCcw } from 'lucide-react';
import { captureWhatsBillError } from '@/lib/sentry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  eventId: string | null;
}

export class SentryErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    eventId: null,
  };

  public static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const eventId = captureWhatsBillError(error, {
      module: 'auth',
      action: 'unhandled_component_error',
      errorType: 'react_error_boundary',
      extra: {
        componentStack: errorInfo.componentStack?.substring(0, 500),
      },
    });

    this.setState({ eventId });
  }

  private handleReset = () => {
    this.setState({ hasError: false, eventId: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Application Recovered Safely</h2>
              <p className="text-xs text-slate-500 mt-1">
                An unexpected system error occurred. A secure, sanitized report has been sent to Sentry for diagnosis.
              </p>
            </div>

            {this.state.eventId && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-left">
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-medium">
                  Incident Reference ID
                </span>
                <span className="text-xs font-mono text-slate-700 font-semibold select-all">
                  {this.state.eventId}
                </span>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 transition"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
