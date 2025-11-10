import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Text, TouchableOpacity, Animated, ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
// Lazy require to avoid type resolution issues during linting if package isn't installed yet
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MaskedView = require('@react-native-masked-view/masked-view').default;
import { usePlantState } from '@/src/hooks/usePlantState';
import { HealthBars } from '@/src/components/HealthBars';
import { PixelCameraIcon } from '@/src/components/PixelCameraIcon';
import { spacing, colors, typography } from '@/src/theme';
import {
  isSoilOptimal,
  isTempOptimal,
  isHumOptimal,
  isMq2Optimal,
} from '@/src/services/plantModel';

const COLD_ANIMATION = require('../../assets/images/cold.gif');
const PEAK_ANIMATION = require('../../assets/images/peak.gif');
const AIR_BAD_ANIMATION = require('../../assets/images/air_bad.gif');
const DIZZY_ANIMATION = require('../../assets/images/dizzy.gif');
const DRY_ANIMATION = require('../../assets/images/dry.gif');

/**
 * DashboardScreen - Shows background image with blurred section below black line
 * Health bars are displayed on top of the blurred area
 */
export default function DashboardScreen() {
  const { scores, rawVitals } = usePlantState();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const router = useRouter();

  // Sensor status helpers for animation selection
  const { soilMoisture, temperature, humidity, mq2 } = rawVitals;

  const allSensorsOptimal = useMemo(() => {
    return (
      isSoilOptimal(soilMoisture) &&
      isTempOptimal(temperature) &&
      isHumOptimal(humidity) &&
      isMq2Optimal(mq2)
    );
  }, [soilMoisture, temperature, humidity, mq2]);

  const animationSource = useMemo(() => {
    // Highest priority: very bad air quality
    if (mq2 >= 350) {
      return DIZZY_ANIMATION;
    }
    // Next priority: bad air quality
    if (mq2 >= 200) {
      return AIR_BAD_ANIMATION;
    }
    // Dry soil
    if (soilMoisture >= 900) {
      return DRY_ANIMATION;
    }
    if (temperature < 13) {
      return COLD_ANIMATION;
    }
    if (allSensorsOptimal) {
      return PEAK_ANIMATION;
    }
    return null;
  }, [temperature, allSensorsOptimal, mq2, soilMoisture]);

  const [currentAnimation, setCurrentAnimation] = useState<ImageSourcePropType | null>(animationSource);
  const [incomingAnimation, setIncomingAnimation] = useState<ImageSourcePropType | null>(null);
  const [incomingReady, setIncomingReady] = useState(false);
  const currentOpacity = useRef(new Animated.Value(animationSource ? 1 : 0)).current;
  const incomingOpacity = useRef(new Animated.Value(0)).current;
  const isTransitioningRef = useRef(false);
  const revealScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animationSource === currentAnimation) {
      return;
    }

    if (!animationSource) {
      if (currentAnimation) {
        Animated.timing(currentOpacity, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }).start(() => {
          setCurrentAnimation(null);
          currentOpacity.setValue(1);
        });
      }
      return;
    }

    if (!currentAnimation) {
      setCurrentAnimation(animationSource);
      currentOpacity.setValue(0);
      Animated.timing(currentOpacity, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }).start();
      return;
    }

    setIncomingAnimation(animationSource);
    setIncomingReady(false);
    incomingOpacity.setValue(0);
    isTransitioningRef.current = false;
  }, [animationSource, currentAnimation, currentOpacity, incomingOpacity]);

  useEffect(() => {
    if (!incomingAnimation || !incomingReady || isTransitioningRef.current) {
      return;
    }

    isTransitioningRef.current = true;
    // Circular reveal from pot center: compute required final scale
    const circleBaseSize = 110; // slightly smaller base to enlarge effective scale
    const maxDistance = Math.sqrt(windowWidth * windowWidth + windowHeight * windowHeight);
    const finalScale = (maxDistance / circleBaseSize) * 1.4; // larger overshoot to cover edges faster

    revealScale.setValue(0.01); // start a bit larger to avoid initial edge glimpse
    incomingOpacity.setValue(1);
    // Softly dim the current layer while revealing the new one
    Animated.parallel([
      Animated.timing(revealScale, {
        toValue: finalScale,
        duration: 560, // slower, smoother reveal
        useNativeDriver: true,
      }),
      Animated.timing(currentOpacity, {
        toValue: 0.1, // fade a bit more
        duration: 560, // match reveal duration for seamless blend
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentAnimation(animationSource);
      currentOpacity.setValue(1);
      setTimeout(() => {
        setIncomingAnimation(null);
        incomingOpacity.setValue(0);
        setIncomingReady(false);
        isTransitioningRef.current = false;
        revealScale.setValue(0);
      }, 60);
    });
  }, [animationSource, incomingAnimation, incomingReady, windowWidth, windowHeight, currentOpacity, incomingOpacity, revealScale]);

  // Position of the black line (as percentage of screen height)
  // Adjust this value based on your background image
  const BLACK_LINE_POSITION = 0.65; // 65% down the screen
  const BLACK_LINE_HEIGHT = 4;
  const blackLineTop = windowHeight * BLACK_LINE_POSITION;
  const blurredSectionTop = blackLineTop + BLACK_LINE_HEIGHT;
  const blurredSectionHeight = windowHeight - blurredSectionTop;

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <View style={styles.container}>
        {/* Camera Icon Button - Top Right */}
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={() => router.push('/camera')}
          activeOpacity={0.7}
        >
          <PixelCameraIcon size={32} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Background Image */}
        <Image
          source={require('../../assets/images/sunny_window.png')}
          style={styles.backgroundImage}
          contentFit="cover"
        />
        {/* Plant animation overlay (condition-based GIF) */}
        {currentAnimation && (
          <Animated.View
            style={[styles.layerImage, { zIndex: 2, opacity: currentOpacity }]}
          >
            <Image
              source={currentAnimation}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          </Animated.View>
        )}
        {incomingAnimation && (
          <MaskedView
            style={[styles.layerImage, { zIndex: 3 }]}
            maskElement={
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <Animated.View
                  style={[
                    styles.revealCircle,
                    {
                      transform: [
                        { translateX: -60 }, // half of base size (120)
                        { translateY: -60 },
                        { scale: revealScale },
                      ],
                      left: (windowWidth) * 0.5,
                      top: (windowHeight) * 0.56, // approx pot center
                    },
                  ]}
                />
              </View>
            }
          >
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: incomingOpacity }]}>
              <Image
                source={incomingAnimation}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                onLoad={() => setIncomingReady(true)}
                onError={() => setIncomingReady(true)}
              />
            </Animated.View>
          </MaskedView>
        )}

        {/* Black Line Separator */}
        <View
          style={[
            styles.blackLine,
            {
              top: blackLineTop,
            },
          ]}
        />

        {/* Blurred Section Below Black Line - Using multiple layers for better blur effect */}
        <View
          style={[
            styles.blurredSection,
            {
              top: blurredSectionTop,
              height: blurredSectionHeight,
            },
          ]}>
          {/* Background blur layer - High intensity, no tint for true Gaussian blur */}
          <BlurView
            intensity={120}
            tint="default"
            style={styles.blurLayer}
          />
          {/* Health Bars on top of blurred area */}
          {scores && (
            <View style={styles.healthBarsContainer}>
              <HealthBars scores={scores} rawVitals={rawVitals} />
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  layerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blackLine: {
    position: 'absolute',
    width: '100%',
    height: 4,
    backgroundColor: '#000000',
    zIndex: 5, // Above all image layers, below health bars
  },
  blurredSection: {
    position: 'absolute',
    width: '100%',
    left: 0,
    right: 0,
    zIndex: 6, // Above all image layers and black line, contains health bars
    overflow: 'hidden',
  },
  blurLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  healthBarsContainer: {
    position: 'relative',
    zIndex: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    justifyContent: 'flex-start',
  },
  revealCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#000', // Mask uses alpha; black shows, transparent hides
  },
  cameraButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 20, // Above all other elements
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5, // Android shadow
  },
});
