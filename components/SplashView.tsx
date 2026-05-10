import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence, 
  withDelay,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, Icons } from './Icon';

const { width } = Dimensions.get('window');

interface SplashViewProps {
  onAnimationComplete: () => void;
}

export const SplashView = ({ onAnimationComplete }: SplashViewProps) => {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.2, { duration: 1000, easing: Easing.out(Easing.back(1.5)) }),
      withTiming(1, { duration: 500 })
    );
    opacity.value = withTiming(1, { duration: 1000 });
    
    textOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));
    translateY.value = withDelay(800, withTiming(0, { duration: 800 }));

    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 500 }, (finished) => {
        if (finished) {
          runOnJS(onAnimationComplete)();
        }
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const loaderStyle = useAnimatedStyle(() => ({
    width: withTiming('100%', { duration: 2500, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
  }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1A1A1A', '#0D0D0D']} style={StyleSheet.absoluteFill} />
      
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <View style={styles.iconCircle}>
          <LinearGradient 
            colors={['#F97316', '#EA580C']} 
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Icon name={Icons.dumbbell} size={50} color="#0D0D0D" />
        </View>
      </Animated.View>

      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={styles.title}>FORGE<Text style={styles.highlight}>FIT</Text></Text>
        <Text style={styles.subtitle}>STRENGTH IN EVERY REP</Text>
      </Animated.View>
      
      <View style={styles.bottomBar}>
        <View style={styles.loaderLine}>
          <Animated.View style={[styles.loaderFill, loaderStyle]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  textContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  highlight: {
    color: '#F97316',
  },
  subtitle: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '600',
    letterSpacing: 5,
    marginTop: 10,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 50,
    width: width * 0.6,
  },
  loaderLine: {
    height: 2,
    backgroundColor: '#18181B',
    borderRadius: 1,
    overflow: 'hidden',
  },
  loaderFill: {
    height: '100%',
    width: '0%',
    backgroundColor: '#F97316',
  }
});

