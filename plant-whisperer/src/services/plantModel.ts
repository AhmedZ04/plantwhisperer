/**
 * Plant model with Birkin-specific scoring logic
 * Pure functions for computing scores and deriving mood/emotion from sensor data
 */

import { PlantMood, EmotionState, PlantVitalsRaw, PlantScores } from '../types/plant';

// MQ-2 baseline (can be calibrated)
let mq2Baseline = 200;

/**
 * Set MQ-2 baseline for air quality calculations
 */
export function setMq2Baseline(baseline: number): void {
  mq2Baseline = baseline;
}

/**
 * Get current MQ-2 baseline
 */
export function getMq2Baseline(): number {
  return mq2Baseline;
}

/**
 * Compute hydration score for Philodendron Birkin
 * Soil sensor: higher = drier
 * 
 * DEADZONE (Optimal Range): 480-620
 *   - Accounts for sensor inaccuracies and human watering variations
 *   - Any value in this range = perfect score (100)
 *   - This is a RANGE, not a single point value
 * 
 * Ideal band: 450-700 (acceptable range)
 * Acceptable: 350-850 (tolerable range)
 */
export function computeHydrationScore(soil: number, rain: number): number {
  const SOGGY = 350;
  const DRY = 850;
  const IDEAL_WET = 450;
  const IDEAL_DRY = 700;
  
  // DEADZONE: Wide range for optimal conditions (accounts for sensor/human error)
  // This range is intentionally wide to account for:
  // - Sensor calibration variations
  // - Human watering timing differences
  // - Soil composition variations
  // - Environmental factors
  const DEADZONE_MIN = 480;  // Wider than before (was 500)
  const DEADZONE_MAX = 620;  // Wider than before (was 600)

  const clamped = Math.max(SOGGY, Math.min(DRY, soil));

  let score: number;

  // Check if within deadzone (optimal range) - score = 100
  if (clamped >= DEADZONE_MIN && clamped <= DEADZONE_MAX) {
    score = 100; // Deadzone range = perfect (accounts for variations)
  } else if (clamped < IDEAL_WET) {
    // Too wet (below ideal range) -> score 20-100 as it approaches IDEAL_WET
    const r = (clamped - SOGGY) / (IDEAL_WET - SOGGY);
    score = 20 + r * 80;
  } else if (clamped < DEADZONE_MIN) {
    // Between IDEAL_WET and DEADZONE_MIN (in ideal range, approaching deadzone)
    // Score increases from 60 to 100 as we approach deadzone
    const r = (clamped - IDEAL_WET) / (DEADZONE_MIN - IDEAL_WET);
    score = 60 + r * 40; // 60 -> 100
  } else if (clamped <= IDEAL_DRY) {
    // Between DEADZONE_MAX and IDEAL_DRY (in ideal range, leaving deadzone)
    // Score decreases from 100 to 60 as we move away from deadzone
    const r = (clamped - DEADZONE_MAX) / (IDEAL_DRY - DEADZONE_MAX);
    score = 100 - r * 40; // 100 -> 60
  } else {
    // Too dry (above ideal range) -> score 0-60
    const r = (clamped - IDEAL_DRY) / (DRY - IDEAL_DRY);
    score = 60 - r * 60;
  }

  // If raindrop indicates freshly wet, slightly cushion low score
  if (rain < 400 && score < 60) {
    score = Math.min(60, score + 15);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Compute temperature score for Birkin
 * 
 * DEADZONE (Optimal Range): 21-25°C
 *   - Accounts for sensor inaccuracies and room temperature variations
 *   - Any value in this range = perfect score (100)
 *   - This is a RANGE, not a single point value
 * 
 * Ideal: 20-26°C (comfortable range)
 * Acceptable: 18-29°C (tolerable range)
 */
function computeTempScore(temp: number): number {
  const ACCEPTABLE_MIN = 18;
  const ACCEPTABLE_MAX = 29;
  const IDEAL_MIN = 20;
  const IDEAL_MAX = 26;
  
  // DEADZONE: Wide range for optimal temperature (accounts for sensor/environmental variations)
  // This range is intentionally wide to account for:
  // - Temperature sensor accuracy (±1-2°C typical)
  // - Room temperature fluctuations
  // - Sensor placement variations
  // - Time of day variations
  const DEADZONE_MIN = 21;  // Slightly wider (was 22)
  const DEADZONE_MAX = 25;  // Same as before

  // Check if within deadzone (optimal range) - score = 100
  if (temp >= DEADZONE_MIN && temp <= DEADZONE_MAX) {
    return 100; // Deadzone range = perfect (accounts for variations)
  }

  // Outside acceptable range - score 0-40
  if (temp < ACCEPTABLE_MIN || temp > ACCEPTABLE_MAX) {
    if (temp < ACCEPTABLE_MIN) {
      const r = (temp - 10) / (ACCEPTABLE_MIN - 10);
      return Math.max(0, Math.round(r * 40));
    } else {
      const r = (35 - temp) / (35 - ACCEPTABLE_MAX);
      return Math.max(0, Math.round(r * 40));
    }
  }

  // Within acceptable but outside deadzone - score 40-100
  if (temp < DEADZONE_MIN) {
    // Between ACCEPTABLE_MIN and DEADZONE_MIN
    const r = (temp - ACCEPTABLE_MIN) / (DEADZONE_MIN - ACCEPTABLE_MIN);
    return Math.round(40 + r * 60); // 40 -> 100
  } else {
    // Between DEADZONE_MAX and ACCEPTABLE_MAX
    const r = (ACCEPTABLE_MAX - temp) / (ACCEPTABLE_MAX - DEADZONE_MAX);
    return Math.round(40 + r * 60); // 40 -> 100
  }
}

/**
 * Compute humidity score for Birkin
 * 
 * DEADZONE (Optimal Range): 55-68%
 *   - Accounts for sensor inaccuracies and environmental humidity variations
 *   - Any value in this range = perfect score (100)
 *   - This is a RANGE, not a single point value
 * 
 * Ideal: 50-70% (comfortable range)
 * Acceptable: 40-80% (tolerable range)
 */
function computeHumScore(hum: number): number {
  const ACCEPTABLE_MIN = 40;
  const ACCEPTABLE_MAX = 80;
  const IDEAL_MIN = 50;
  const IDEAL_MAX = 70;
  
  // DEADZONE: Wide range for optimal humidity (accounts for sensor/environmental variations)
  // This range is intentionally wide to account for:
  // - Humidity sensor accuracy (±3-5% typical)
  // - Room humidity fluctuations
  // - Seasonal variations
  // - Ventilation effects
  const DEADZONE_MIN = 55;  // Same as before
  const DEADZONE_MAX = 68;  // Wider than before (was 65)

  // Check if within deadzone (optimal range) - score = 100
  if (hum >= DEADZONE_MIN && hum <= DEADZONE_MAX) {
    return 100; // Deadzone range = perfect (accounts for variations)
  }

  // Outside acceptable range - score 0-40
  if (hum < ACCEPTABLE_MIN || hum > ACCEPTABLE_MAX) {
    if (hum < ACCEPTABLE_MIN) {
      const r = (hum - 20) / (ACCEPTABLE_MIN - 20);
      return Math.max(0, Math.round(r * 40));
    } else {
      const r = (90 - hum) / (90 - ACCEPTABLE_MAX);
      return Math.max(0, Math.round(r * 40));
    }
  }

  // Within acceptable but outside deadzone - score 40-100
  if (hum < DEADZONE_MIN) {
    // Between ACCEPTABLE_MIN and DEADZONE_MIN
    const r = (hum - ACCEPTABLE_MIN) / (DEADZONE_MIN - ACCEPTABLE_MIN);
    return Math.round(40 + r * 60); // 40 -> 100
  } else {
    // Between DEADZONE_MAX and ACCEPTABLE_MAX
    const r = (ACCEPTABLE_MAX - hum) / (ACCEPTABLE_MAX - DEADZONE_MAX);
    return Math.round(40 + r * 60); // 40 -> 100
  }
}

/**
 * Compute comfort score (average of temp and humidity scores)
 */
export function computeComfortScore(temp: number, hum: number): number {
  const tempScore = computeTempScore(temp);
  const humScore = computeHumScore(hum);
  return Math.round((tempScore + humScore) / 2);
}

/**
 * Compute air quality score based on MQ-2 sensor
 * Uses ratio to baseline
 * 
 * DEADZONE (Optimal Range): ratio <= 1.15
 *   - Accounts for sensor noise and baseline calibration variations
 *   - Any ratio in this range = perfect score (100)
 *   - This is a RANGE, not a single point value
 * 
 * The ratio represents current reading / baseline reading
 * - Lower ratio = better air quality
 * - Higher ratio = worse air quality (more pollutants)
 */
export function computeAirQualityScore(mq2: number): number {
  if (mq2Baseline <= 0) {
    return 50; // Default if baseline not set
  }

  const ratio = mq2 / mq2Baseline;

  // DEADZONE: Wide range for optimal air quality (accounts for sensor noise/calibration)
  // This range is intentionally wide to account for:
  // - MQ-2 sensor noise and drift
  // - Baseline calibration variations
  // - Normal environmental fluctuations
  // - Sensor warm-up time
  const DEADZONE_MAX_RATIO = 1.15;  // Wider than before (was 1.1)

  // Check if within deadzone (optimal range) - score = 100
  if (ratio <= DEADZONE_MAX_RATIO) {
    return 100; // Deadzone range = perfect (accounts for sensor variations)
  } else if (ratio <= 1.5) {
    // Just outside deadzone - score 70-100
    const r = (ratio - DEADZONE_MAX_RATIO) / (1.5 - DEADZONE_MAX_RATIO);
    return Math.round(100 - r * 30); // 100 -> 70
  } else if (ratio <= 2.0) {
    // Moderate air quality issues - score 40-70
    const r = (ratio - 1.5) / (2.0 - 1.5);
    return Math.round(70 - r * 30); // 70 -> 40
  } else {
    // Poor air quality - score 20-40
    const r = Math.min(1, (ratio - 2.0) / 2.0);
    return Math.round(40 - r * 20); // 40 -> 20
  }
}

/**
 * Compute bio signal score
 * 
 * DEADZONE (Optimal Range): 4-22
 *   - Accounts for sensor signal variations and electrode contact differences
 *   - Any value in this range = perfect score (100)
 *   - This is a RANGE, not a single point value
 * 
 * Bio signal represents the variance/quality of the BioAmp EXG signal
 * - Very low (<2) = flat signal / disconnected electrodes
 * - Optimal (4-22) = good signal variance (healthy connection)
 * - Very high (>60) = noisy signal / interference
 */
export function computeBioSignalScore(bio: number): number {
  // DEADZONE: Wide range for optimal bio signal (accounts for signal variations)
  // This range is intentionally wide to account for:
  // - Electrode contact variations
  // - Signal noise and interference
  // - Plant movement
  // - Sensor calibration differences
  const DEADZONE_MIN = 4;   // Wider than before (was 5)
  const DEADZONE_MAX = 22;  // Wider than before (was 20)
  
  const ACCEPTABLE_LOW = 2;
  const ACCEPTABLE_HIGH = 60;

  // Check if within deadzone (optimal range) - score = 100
  if (bio >= DEADZONE_MIN && bio <= DEADZONE_MAX) {
    return 100; // Deadzone range = perfect (accounts for signal variations)
  }
  
  // Very low = disconnected/flat - score 0-20
  if (bio < ACCEPTABLE_LOW) {
    const r = Math.max(0, bio / ACCEPTABLE_LOW);
    return Math.round(r * 20); // 0 -> 20
  }
  
  // Between ACCEPTABLE_LOW and DEADZONE_MIN - score 20-100
  if (bio >= ACCEPTABLE_LOW && bio < DEADZONE_MIN) {
    const r = (bio - ACCEPTABLE_LOW) / (DEADZONE_MIN - ACCEPTABLE_LOW);
    return Math.round(20 + r * 80); // 20 -> 100
  }
  
  // Between DEADZONE_MAX and ACCEPTABLE_HIGH - score 40-100
  if (bio > DEADZONE_MAX && bio <= ACCEPTABLE_HIGH) {
    const r = (bio - DEADZONE_MAX) / (ACCEPTABLE_HIGH - DEADZONE_MAX);
    return Math.round(100 - r * 60); // 100 -> 40
  }
  
  // Too high = very noisy - score 0-40
  return Math.max(0, Math.round(40 - (bio - ACCEPTABLE_HIGH) / 2));
}

/**
 * Derive mood from scores
 */
export function deriveMood(scores: PlantScores): PlantMood {
  const { hydrationScore, comfortScore, airQualityScore, bioSignalScore } = scores;

  if (hydrationScore < 10) return 'critical';
  if (hydrationScore < 30) return 'thirsty';
  if (comfortScore < 30 || airQualityScore < 30 || bioSignalScore < 20) return 'stressed';
  if (
    hydrationScore > 80 &&
    comfortScore > 80 &&
    airQualityScore > 70 &&
    bioSignalScore > 40
  ) return 'thriving';
  return 'ok';
}

/**
 * Derive emotion state from scores and raw vitals
 */
export function deriveEmotionState(scores: PlantScores, vitals: PlantVitalsRaw): EmotionState {
  const { hydrationScore, comfortScore, airQualityScore, bioSignalScore } = scores;
  const { temp, hum, soil, rain } = {
    temp: vitals.temperature,
    hum: vitals.humidity,
    soil: vitals.soilMoisture,
    rain: vitals.raindrop,
  };

  // Watering detection: raindrop very wet & hydration low -> being watered
  if (rain < 400 && hydrationScore < 60) return 'I_AM_BEING_WATERED';

  // Nearly dead: extreme dryness
  if (hydrationScore <= 10) return 'I_AM_NEARLY_DEAD';

  // Thirsty
  if (hydrationScore > 10 && hydrationScore < 30) return 'I_NEED_WATER';

  // Too hot
  if (temp >= 30) return 'I_FEEL_HOT';

  // Too cold
  if (temp <= 15) return 'I_FEEL_COLD';

  // Too humid
  if (hum >= 80) return 'I_AM_SWEATING_THIS_IS_TOO_HUMID';

  // Bad air quality
  if (airQualityScore < 40) return 'AIR_FEELS_BAD';

  // Bad bio link
  if (bioSignalScore < 20) return 'CHECK_MY_CONNECTION';

  // Default gradients
  if (
    hydrationScore >= 80 &&
    comfortScore >= 80 &&
    airQualityScore >= 70 &&
    bioSignalScore >= 40
  ) {
    return 'I_FEEL_GREAT';
  }

  return 'I_AM_OKAY';
}

/**
 * Get human-readable message for emotion state
 */
export function getEmotionMessage(emotion: EmotionState): string {
  switch (emotion) {
    case 'I_NEED_WATER':
      return "I'm thirsty, please water me soon.";
    case 'I_AM_BEING_WATERED':
      return 'Ahh, thank you for the water 💧';
    case 'I_FEEL_HOT':
      return "It's too hot here.";
    case 'I_AM_SWEATING_THIS_IS_TOO_HUMID':
      return "Too humid, I can't breathe.";
    case 'AIR_FEELS_BAD':
      return 'Air quality feels off.';
    case 'CHECK_MY_CONNECTION':
      return 'Check my clips/electrodes.';
    case 'I_AM_NEARLY_DEAD':
      return 'I need water urgently!';
    case 'I_FEEL_COLD':
      return "It's too cold here.";
    case 'I_FEEL_GREAT':
      return 'I feel amazing!';
    case 'I_AM_OKAY':
      return 'I am doing okay.';
    default:
      return 'Status update.';
  }
}

