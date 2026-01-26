import { WorkoutsMap, AppSettings, WorkoutHistoryEntry, BodyMeasurement, CardioSession } from '../types';
import { DEFAULT_WORKOUTS, DEFAULT_SETTINGS, CLIENT_CONFIG } from '../constants';

const WORKOUTS_KEY = CLIENT_CONFIG.storageKey; // Dynamic key
const SETTINGS_KEY = 'app_settings';
const LOGO_KEY = 'app_logo';
const MEASUREMENTS_KEY = `${WORKOUTS_KEY}_measurements`;
const CARDIO_KEY = `${WORKOUTS_KEY}_cardio`;

export const storage = {
  getWorkouts: (): WorkoutsMap => {
    try {
      const saved = localStorage.getItem(WORKOUTS_KEY);
      if (saved && saved !== "undefined") {
        return JSON.parse(saved);
      }
    } catch (e) { console.error(e); }
    // If no custom workouts found (or new client key), load defaults from constants.ts
    return JSON.parse(JSON.stringify(DEFAULT_WORKOUTS));
  },

  saveWorkouts: (data: WorkoutsMap) => {
    localStorage.setItem(WORKOUTS_KEY, JSON.stringify(data));
  },

  getSettings: (): AppSettings => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch (e) { return DEFAULT_SETTINGS; }
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  getLogo: (): string => {
    return localStorage.getItem(LOGO_KEY) || 'https://lh3.googleusercontent.com/u/0/d/1GZ-QR4EyK6Ho9czlpTocORhwiHW4FGnP';
  },

  saveLogo: (dataUrl: string) => {
    localStorage.setItem(LOGO_KEY, dataUrl);
  },

  getHistory: (workoutId: string): WorkoutHistoryEntry[] => {
    try {
      // History is prefixed with client key to separate history between clients/versions
      const data = localStorage.getItem(`${WORKOUTS_KEY}_history_${workoutId}`);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  saveHistory: (workoutId: string, history: WorkoutHistoryEntry[]) => {
    localStorage.setItem(`${WORKOUTS_KEY}_history_${workoutId}`, JSON.stringify(history));
  },

  getMeasurements: (): BodyMeasurement[] => {
    try {
      const data = localStorage.getItem(MEASUREMENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  saveMeasurements: (data: BodyMeasurement[]) => {
    localStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(data));
  },

  getCardioSessions: (): CardioSession[] => {
    try {
      const data = localStorage.getItem(CARDIO_KEY);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  saveCardioSessions: (data: CardioSession[]) => {
    localStorage.setItem(CARDIO_KEY, JSON.stringify(data));
  },

  getLastResult: (workoutId: string, exerciseId: string): string | null => {
    // Check specific history first
    const lastSpecific = localStorage.getItem(`${WORKOUTS_KEY}_last_${workoutId}_${exerciseId}`);
    if (lastSpecific) return lastSpecific;

    // Fallback to searching full history
    try {
      const hist = storage.getHistory(workoutId);
      if (hist.length > 0) {
        // Find most recent session that has this exercise
        for (const session of hist) {
            if (session.results[exerciseId]) return session.results[exerciseId];
        }
      }
    } catch(e) {}
    return null;
  },

  // Temp input storage for crash recovery
  saveTempInput: (key: string, value: string) => {
    localStorage.setItem('temp_' + key, value);
  },

  getTempInput: (key: string): string => {
    return localStorage.getItem('temp_' + key) || '';
  },

  clearTempInputs: (workoutId: string, exercises: any[]) => {
    // We update last result specifically here for quick lookup next time
    exercises.forEach(ex => {
        // Find if we have inputs for this ex
        let summaryParts: string[] = [];
        for(let i=1; i<=ex.sets; i++) {
            const uid = `input_${workoutId}_${ex.id}_s${i}`;
            const kg = storage.getTempInput(`${uid}_kg`);
            const reps = storage.getTempInput(`${uid}_reps`);
            const time = storage.getTempInput(`${uid}_time`);
            
            if(kg || reps || time) {
                // Construct result just to save to quick cache
                if(kg && reps) summaryParts.push(`${kg}kg x ${reps}`);
                else if(reps) summaryParts.push(`${reps}p`);
                else if(time) summaryParts.push(`${time}s`);
            }

            // Cleanup
            localStorage.removeItem(`temp_${uid}_kg`);
            localStorage.removeItem(`temp_${uid}_reps`);
            localStorage.removeItem(`temp_${uid}_time`);
        }
        localStorage.removeItem(`temp_note_${workoutId}_${ex.id}`);

        if(summaryParts.length > 0) {
             const note = storage.getTempInput(`note_${workoutId}_${ex.id}`);
             let resStr = summaryParts.join(' | ');
             if(note) resStr += ` [Note: ${note}]`;
             localStorage.setItem(`${WORKOUTS_KEY}_last_${workoutId}_${ex.id}`, resStr);
        }
    });
  }
};