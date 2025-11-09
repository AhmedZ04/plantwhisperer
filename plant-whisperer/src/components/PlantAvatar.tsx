/**
 * PlantAvatar component
 * Displays the plant's avatar/visual representation
 * Implementation placeholder - actual component from Dev B
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlantMood, EmotionState } from '../types/plant';
import { colors, spacing, typography } from '../theme';

interface PlantAvatarProps {
  mood: PlantMood;
  emotion: EmotionState;
  size?: number;
}

export function PlantAvatar({ mood, emotion, size = 120 }: PlantAvatarProps) {
  // TODO: swap text for sprite based on emotion
  // For now, display emotion state name as placeholder

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
      {/* Emotion state placeholder text */}
      <View style={styles.emotionContainer}>
        <Text style={styles.emotionText} numberOfLines={3} adjustsFontSizeToFit>
          {emotion}
        </Text>
      </View>
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
    // Pixel art 3D effect
    borderTopColor: colors.pixelHighlight,
    borderLeftColor: colors.pixelHighlight,
    borderBottomColor: colors.pixelBorderDark,
    borderRightColor: colors.pixelBorderDark,
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

