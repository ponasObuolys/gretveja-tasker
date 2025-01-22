import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import * as Sentry from "@sentry/react";
import { ErrorMessage } from "./ErrorMessage";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isTokenError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isTokenError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    console.error("Error caught by boundary:", error);
    return { 
      hasError: true, 
      error,
      isTokenError: error.message.includes('JWT') || error.message.includes('token')
    };
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
    if (this.state.isTokenError) {
      window.location.href = '/auth';
    } else {
      this.setState({ hasError: false, error: null, isTokenError: false });
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">
              {this.state.isTokenError ? 'Sesija pasibaigė' : 'Atsiprašome, įvyko klaida'}
            </h2>
            <p className="text-muted-foreground">
              {this.state.isTokenError 
                ? 'Prašome prisijungti iš naujo' 
                : this.state.error?.message || 'Bandykite dar kartą vėliau'}
            </p>
            <Button onClick={this.handleReset} variant="default">
              {this.state.isTokenError ? 'Prisijungti' : 'Grįžti į pradžią'}
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}