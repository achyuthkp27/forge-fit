import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Icon, Icons } from './Icon';
import { useTheme } from '../theme/themeContext';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryComponent extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Log to crash monitoring
    if (typeof logCrash === 'function') {
      logCrash(error, 'ErrorBoundary');
    }
    // Also log to console for development
    if (__DEV__) {
      console.error('[ErrorBoundary] Caught error:', error);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReport = () => {
    // Open email or feedback form with error details
    const errorInfo = this.state.error
      ? `Error: ${this.state.error.message}\nStack: ${this.state.error.stack}`
      : 'Unknown error';

    const mailtoLink = `mailto:support@forgefit.app?subject=Bug%20Report&body=${encodeURIComponent(errorInfo)}`;
    Linking.openURL(mailtoLink).catch(() => {});
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} onReport={this.handleReport} />;
    }

    return this.props.children;
  }
}

// Reference for external crash logging (set by useErrorHandler)
let logCrash: (error: Error, context: string) => void = () => {};

export function setCrashLogger(fn: (error: Error, context: string) => void) {
  logCrash = fn;
}

interface ErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
  onReport: () => void;
}

function ErrorFallback({ error, onRetry, onReport }: ErrorFallbackProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0D0D0D' : '#FAFAFA' }]}>
      <View style={[styles.card, { backgroundColor: isDark ? '#1A1A1E' : '#FFFFFF' }]}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? '#2A1A1A' : '#FEF2F2' }]}>
            <Icon name={Icons.alertTriangle} size={32} color="#EF4444" />
          </View>
        </View>

        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
          Something went wrong
        </Text>

        <Text style={[styles.message, { color: isDark ? '#A1A1AA' : '#6B7280' }]}>
          An unexpected error occurred. Don't worry — your data is safe.
        </Text>

        {error && __DEV__ && (
          <View style={[styles.errorBox, { backgroundColor: isDark ? '#2A1A1A' : '#F8F8F8' }]}>
            <Text style={[styles.errorLabel, { color: isDark ? '#A1A1AA' : '#6B7280' }]}>
              Error Details (Dev)
            </Text>
            <Text style={[styles.errorText, { color: isDark ? '#EF4444' : '#DC2626' }]}>
              {error.message}
            </Text>
            {error.stack && (
              <Text style={[styles.errorStack, { color: isDark ? '#71717A' : '#9CA3AF' }]}>
                {error.stack.split('\n').slice(0, 5).join('\n')}
              </Text>
            )}
          </View>
        )}

        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.button, styles.retryButton]} onPress={onRetry}>
            <Icon name={Icons.refresh} size={16} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.reportButton]} onPress={onReport}>
            <Text style={styles.reportButtonText}>Report Issue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  errorBox: {
    width: '100%',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  errorStack: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  retryButton: {
    backgroundColor: '#EF4444',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  reportButton: {
    backgroundColor: '#27272A',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  reportButtonText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '500',
  },
});

export { ErrorBoundaryComponent as ErrorBoundary };