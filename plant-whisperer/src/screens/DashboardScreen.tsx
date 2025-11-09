import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors, spacing, typography } from '@/src/theme';
import { usePlantState } from '@/src/hooks/usePlantState';
import { ConnectionStatusPill } from '@/src/components/ConnectionStatusPill';
import { PlantAvatar } from '@/src/components/PlantAvatar';
import { HealthBars } from '@/src/components/HealthBars';
import { ReminderBanner } from '@/src/components/ReminderBanner';
import { EventLog } from '@/src/components/EventLog';
import { PixelCameraIcon } from '@/src/components/PixelCameraIcon';

/**
 * DashboardScreen - Main dashboard for the plant care game
 * Composition layer that wires up existing components & hooks
 * Uses pixel/retro theme system for all styling
 */
export default function DashboardScreen() {
  const router = useRouter();
  const {
    vitals,
    scores,
    mood,
    emotion,
    eventLog,
    pendingReminder,
    connectionStatus,
    name,
    level,
    status,
  } = usePlantState();

  const handleCameraPress = () => {
    router.push('/camera');
  };

  // Debug: Log connection status for troubleshooting
  useEffect(() => {
    if (connectionStatus === 'error') {
      console.warn('WebSocket connection error. Make sure:');
      console.warn('1. Mock server is running on port 4000');
      console.warn('2. Device and computer are on the same network');
      console.warn('3. Firewall allows connections on port 4000');
    }
  }, [connectionStatus]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header with Title and Camera Icon */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Plant Whisperer</Text>
            {name && (
              <Text style={styles.subtitle}>{name}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleCameraPress}
            activeOpacity={0.8}>
            <PixelCameraIcon size={spacing.xl} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Connection Status */}
        <View style={styles.statusContainer}>
          <ConnectionStatusPill status={connectionStatus} />
        </View>

        {/* Plant Avatar - Centered */}
        <View style={styles.avatarContainer}>
          <PlantAvatar mood={mood} emotion={emotion} size={140} />
          {level && (
            <Text style={styles.levelText}>Level {level}</Text>
          )}
        </View>

        {/* Health Bars */}
        <View style={styles.healthBarsContainer}>
          <HealthBars scores={scores} />
        </View>

        {/* Reminder Banner */}
        {pendingReminder && (
          <View style={styles.reminderContainer}>
            <ReminderBanner reminders={[pendingReminder]} />
          </View>
        )}

        {/* Event Log */}
        <View style={styles.eventLogContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <EventLog events={eventLog} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    fontFamily: 'monospace', // Pixel art font
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    fontFamily: 'monospace', // Pixel art font
  },
  cameraButton: {
    width: spacing.xxl + spacing.md,
    height: spacing.xxl + spacing.md,
    borderRadius: 0, // Sharp corners for pixel art
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3, // Thicker border
    // Pixel art 3D button effect
    borderTopColor: colors.pixelHighlight,
    borderLeftColor: colors.pixelHighlight,
    borderBottomColor: colors.pixelBorderDark,
    borderRightColor: colors.pixelBorderDark,
  },
  statusContainer: {
    marginBottom: spacing.xl,
    alignItems: 'flex-start',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
  },
  levelText: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontFamily: 'monospace', // Pixel art font
  },
  healthBarsContainer: {
    marginBottom: spacing.xl,
    // No background, no border - health bars have their own styling
  },
  reminderContainer: {
    marginBottom: spacing.xl,
  },
  eventLogContainer: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    fontFamily: 'monospace', // Pixel art font
  },
});
