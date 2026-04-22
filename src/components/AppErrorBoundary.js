import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ERROR_BOUNDARY] Caught error:', error.message);
    console.error('[ERROR_BOUNDARY] Component stack:', info.componentStack);
  }

  handleRestart = () => {
    this.setState((s) => ({ hasError: false, retryCount: s.retryCount + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.logo}>VENTURE</Text>
          <Text style={styles.message}>Something went wrong.</Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRestart}>
            <Text style={styles.buttonText}>Tap to restart</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Key forces full unmount + remount of the subtree on restart
    return (
      <React.Fragment key={this.state.retryCount}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  logo: {
    ...Typography.h1,
    color: Colors.white,
    letterSpacing: 4,
    marginBottom: 40,
  },
  message: {
    ...Typography.body,
    color: Colors.slateGray,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: Colors.electricBlue,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: Colors.borderGray,
  },
  buttonText: {
    ...Typography.buttonText,
    color: Colors.white,
  },
});
