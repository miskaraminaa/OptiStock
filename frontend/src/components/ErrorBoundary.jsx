import React from 'react';

class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="alert alert-error m-4">
                    <span>Something went wrong: {this.state.error.message}</span>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;