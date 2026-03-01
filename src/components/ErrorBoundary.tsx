import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-[320px] items-center justify-center px-6">
                    <div className="w-full max-w-sm text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-commons-errorBg">
                            <AlertTriangle className="h-6 w-6 text-commons-error" />
                        </div>
                        <h2 className="mt-4 text-base font-semibold text-commons-text">
                            Something went wrong
                        </h2>
                        <p className="mt-1 text-[13px] text-commons-textMid">
                            An unexpected error occurred. Please try again or contact support
                            if the problem persists.
                        </p>
                        {this.state.error && (
                            <p className="mt-3 rounded-md bg-commons-surfaceAlt px-3 py-2 text-left font-mono text-[11px] text-commons-textMid break-all">
                                {this.state.error.message}
                            </p>
                        )}
                        <div className="mt-5 flex items-center justify-center gap-3">
                            <Button onClick={this.handleRetry} variant="secondary">
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Retry
                            </Button>
                            <a
                                href="mailto:support@commons.app"
                                className="text-[13px] text-commons-textMid hover:text-commons-text transition-colors"
                            >
                                Report issue
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
