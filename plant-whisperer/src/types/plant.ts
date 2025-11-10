/**
 * Type definitions for plant-related data structures
 * These types define the expected interfaces for components from Dev A, B, and C
 */

export type PlantStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export type PlantMood = 'happy' | 'sad' | 'neutral' | 'thirsty' | 'needs-sun' | 'critical' | 'stressed' | 'thriving' | 'ok';

export type EmotionState =
  | 'I_FEEL_GREAT'
  | 'I_AM_OKAY'
  | 'I_NEED_WATER'
  | 'I_AM_BEING_WATERED'
  | 'I_AM_NEARLY_DEAD'
  | 'I_FEEL_HOT'
  | 'I_FEEL_COLD'
  | 'I_AM_SWEATING_THIS_IS_TOO_HUMID'
  | 'AIR_FEELS_BAD'
  | 'CHECK_MY_CONNECTION';

export interface PlantVitals {
  health: number; // 0-100
  water: number; // 0-100
  sunlight: number; // 0-100
  soil: number; // 0-100
}

export interface PlantState {
  id: string;
  name: string;
  species?: string;
  mood: PlantMood;
  emotion: EmotionState;
  vitals: PlantVitals;
  status: PlantStatus;
  level?: number;
  lastWatered?: Date;
  lastChecked?: Date;
}

// Raw sensor readings from WebSocket
export interface SensorState {
  soil: number;      // raw 0-1023
  temp: number;      // °C
  hum: number;       // % RH
  mq2: number;       // raw 0-1023
  rain: number;      // raw 0-1023
  bio: number;       // arbitrary 0-100-ish float (signal metric)
}

// Raw vitals with timestamp
export interface PlantVitalsRaw {
  soilMoisture: number;
  temperature: number;
  humidity: number;
  mq2: number;
  raindrop: number;
  bio: number;
  timestamp: Date;
}

// Computed scores (0-100)
export interface PlantScores {
  hydrationScore: number;
  comfortScore: number;
  airQualityScore: number;
  bioSignalScore: number;
}

export interface PlantEvent {
  id: string;
  type: 'watered' | 'checked' | 'level-up' | 'warning' | 'error';
  message: string;
  timestamp: Date;
}

export interface Reminder {
  id: string;
  type: 'water' | 'check' | 'fertilize';
  message: string;
  dueDate: Date;
  isUrgent?: boolean;
}

