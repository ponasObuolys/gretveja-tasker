import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import * as Sentry from "@sentry/react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    if (import.meta.env.PROD) {
      Sentry.captureException(error, {
        extra: {
          componentStack: errorInfo.componentStack,
        },
      });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">
              Atsiprašome, įvyko klaida
            </h2>
            <p className="text-muted-foreground">
              {this.state.error?.message || 'Bandykite dar kartą vėliau'}
            </p>
            <Button onClick={this.handleReset} variant="default">
              Grįžti į pradžią
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}