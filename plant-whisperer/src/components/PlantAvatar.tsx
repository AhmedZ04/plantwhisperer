/**
 * PlantAvatar component
 * Displays the plant's avatar/visual representation
 * Supports GIFs and videos with programmatic scaling
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { PlantMood, EmotionState } from '../types/plant';
import { colors, spacing, typography } from '../theme';

interface PlantAvatarProps {
  mood: PlantMood;
  emotion: EmotionState;
  size?: number;
  /** Scale multiplier for the GIF/video (default: 1.0) */
  scale?: number;
}

// Map emotion states to asset paths
// Add more mappings as you add more GIFs/videos
const getEmotionAsset = (emotion: EmotionState): { type: 'gif' | 'video' | 'text'; source: any } | null => {
  switch (emotion) {
    case 'I_AM_OKAY':
      return {
        type: 'gif',
        source: require('../../assets/images/I_am_okay.gif'),
      };
    case 'I_NEED_WATER':
      return {
        type: 'video',
        source: require('../../assets/videos/I_NEED_WATER.mp4'),
      };
    // Add more mappings as you add assets:
    // case 'I_FEEL_GREAT':
    //   return { type: 'gif', source: require('../../assets/images/I_feel_great.gif') };
    default:
      return null; // Fall back to text
  }
};

export function PlantAvatar({ mood, emotion, size = 120, scale = 1.0 }: PlantAvatarProps) {
  const asset = getEmotionAsset(emotion);
  const imageSize = size * scale; // Scale the GIF/video by the multiplier
  const videoRef = React.useRef<Video>(null);

  // Restart video when emotion changes
  useEffect(() => {
    if (asset?.type === 'video' && videoRef.current) {
      videoRef.current.replayAsync();
    }
  }, [emotion, asset]);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          minHeight: size,
          backgroundColor: colors.primaryLight,
          borderRadius: 0, // Sharp corners for pixel art
        },
      ]}>
      {/* Display GIF if available */}
      {asset && asset.type === 'gif' && (
        <Image
          source={asset.source}
          style={[
            styles.asset,
            {
              width: imageSize,
              height: imageSize,
              maxWidth: size * 0.9, // Ensure it fits within container
              maxHeight: size * 0.9,
            },
          ]}
          contentFit="contain"
        />
      )}

      {/* Display video if available (using expo-av) */}
      {asset && asset.type === 'video' && (
        <Video
          ref={videoRef}
          source={asset.source}
          style={[
            styles.video,
            {
              width: imageSize,
              height: imageSize,
              maxWidth: size * 0.9,
              maxHeight: size * 0.9,
            },
          ]}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping
          isMuted
        />
      )}

      {/* Fallback to text if no asset found */}
      {!asset && (
        <View style={styles.emotionContainer}>
          <Text style={styles.emotionText} numberOfLines={3} adjustsFontSizeToFit>
            {emotion}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3, // Thicker border for pixel art
    borderColor: colors.pixelBorderDark,
    position: 'relative',
    padding: spacing.md,
    overflow: 'hidden', // Clip GIF/video to container bounds
    // Pixel art 3D effect
    borderTopColor: colors.pixelHighlight,
    borderLeftColor: colors.pixelHighlight,
    borderBottomColor: colors.pixelBorderDark,
    borderRightColor: colors.pixelBorderDark,
  },
  asset: {
    // GIF styling
  },
  video: {
    // Video styling
    borderRadius: 0, // Sharp corners for pixel art
  },
  emotionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emotionText: {
    ...typography.body,
    fontFamily: 'monospace',
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
});

