import { WorkoutsMap, AppSettings } from './types';

// ==========================================
// KONFIGURACJA KLIENTA (TUTAJ ZMIENIASZ DANE)
// ==========================================

export const CLIENT_CONFIG = {
  name: "Damian B.", // Zmień na imię nowego klienta
  // Zmieniając ten klucz, wymuszasz reset danych na telefonie klienta (ważne przy zmianie planu)
  storageKey: 'workout_app_damian_v2' 
};

export const DEFAULT_SETTINGS: AppSettings = {
  volume: 0.5,
  soundType: 'beep2',
};

// Tutaj definiujesz strukturę treningów. 
// Klucze (np. "gora", "dol") są ID kategorii.
export const DEFAULT_WORKOUTS: WorkoutsMap = {
  "gora": {
      title: "GÓRA (Upper Body)",
      warmup: [
          { name: "Groiner with rotation", pl: "Groiner z rotacją", link: "https://www.youtube.com/watch?v=_tKPIDhGPIM", reps: "10p / strona" },
          { name: "Cat cow", pl: "Koci grzbiet", link: "https://www.youtube.com/watch?v=LIVJZZyZ2qM", reps: "10p" },
          { name: "Band dislocation", pl: "Przenoszenie gumy", link: "https://www.youtube.com/results?search_query=band+dislocation", reps: "12p" },
          { name: "Y trap raise", pl: "Wznosy Y", link: "https://www.youtube.com/shorts/M5DeSgxNyKQ", reps: "10p" }
      ],
      exercises: [
          { id: "g_1", name: "Bench Press / Hammer Press", pl: "Wyciskanie sztangi / Maszyna", sets: 3, reps: "5-8 / 9-12", tempo: "2011", rir: "2/2/1", rest: 120, link: "https://www.youtube.com/watch?v=Yez7TTi7VWM", type: "standard" },
          { id: "g_2", name: "Lat Pull down", pl: "Ściąganie drążka hammer (nachwyt)", sets: 3, reps: "7-10", tempo: "2111", rir: "2/2/1", rest: 120, link: "https://www.youtube.com/shorts/5s6KGLTMgoI", type: "standard" },
          { id: "g_3", name: "Hammer Shoulder Press", pl: "Wyciskanie na barki (maszyna)", sets: 3, reps: "7-10", tempo: "2111", rir: "2/2/1", rest: 120, link: "https://www.youtube.com/shorts/YtGoAO5QxSo", type: "standard" },
          { id: "g_4", name: "single Arm Horizontal row hammer", pl: "Wiosłowanie hammer jednorącz", sets: 3, reps: "9-12", tempo: "2111", rir: "2/2/1", rest: 120, link: "https://www.youtube.com/shorts/kt7iBID_FPA", type: "standard" },
          { id: "g_5", name: "Lateral Raise", pl: "Wznosy bokiem (linki/hantle)", sets: 3, reps: "9-12", tempo: "2111", rir: "2/1/1", rest: 120, link: "https://www.youtube.com/shorts/xrBcuPNTxLg", type: "standard" },
          { id: "g_6", name: "Spider Curl", pl: "Uginanie ramion ławka skos (Spider)", sets: 3, reps: "9-12", tempo: "2111", rir: "2/2/1", rest: 120, link: "https://www.youtube.com/shorts/ivS3G35bapw", type: "standard" },
          { id: "g_7", name: "Dumbbell skull crusher", pl: "Wyciskanie francuskie hantlami", sets: 3, reps: "9-12", tempo: "2111", rir: "2/2/1", rest: 120, link: "https://www.youtube.com/shorts/EXUdJH-lhKc", type: "standard" },
          { id: "g_8", name: "Dead Bug", pl: "Martwy robak", sets: 2, reps: "7-10 / strona", tempo: "2111", rir: "1", rest: 100, link: "https://www.youtube.com/shorts/TmDPtQBL8-A", type: "reps_only" },
          { id: "g_9", name: "Side Plank", pl: "Deska boczna", sets: 2, reps: "MAX", tempo: "-", rir: "1", rest: 100, link: "https://www.youtube.com/shorts/TmDPtQBL8-A", type: "time" }
      ]
  },
  "dol": {
      title: "DÓŁ (Lower Body)",
      warmup: [
            { name: "Groiner with rotation", pl: "Groiner z rotacją", link: "https://www.youtube.com/watch?v=_tKPIDhGPIM", reps: "10p" },
            { name: "Cat cow", pl: "Koci grzbiet", link: "https://www.youtube.com/watch?v=LIVJZZyZ2qM", reps: "10p" },
            { name: "Band dislocation", pl: "Przenoszenie gumy", link: "https://www.youtube.com/results?search_query=band+dislocation", reps: "12p" },
            { name: "Dynamic 90-90", pl: "Dynamiczne 90-90", link: "https://www.youtube.com/shorts/4s83WKw-LZM", reps: "10p" },
            { name: "Single leg glute bridge", pl: "Wznosy bioder jednonóż", link: "https://www.youtube.com/shorts/qB_bC7-CQjI", reps: "10p" }
      ],
      exercises: [
          { id: "d_1", name: "Leg press", pl: "Wypychanie nogami na suwnicy", sets: 3, reps: "6-9", tempo: "2011", rir: "2/2/1", rest: 120, link: "https://www.youtube.com/shorts/BnacvXdaxq8", type: "standard" },
          { id: "d_2", name: "Hip Extension", pl: "Wyprosty bioder (ławka rzymska)", sets: 3, reps: "7-10", tempo: "3011", rir: "2/2/1", rest: 120, link: "https://www.youtube.com/shorts/fsz1kIjSM50", type: "standard" },
          { id: "d_3", name: "Leg Adduction", pl: "Przywodzenie (maszyna)", sets: 3, reps: "9-12", tempo: "2111", rir: "2/1/1", rest: 120, link: "https://www.youtube.com/shorts/-Fjmj0hZY4g", type: "standard" },
          { id: "d_4", name: "Leg Extension", pl: "Wyprosty nóg (hammer)", sets: 3, reps: "10-15", tempo: "2111", rir: "1", rest: 120, link: "https://www.youtube.com/shorts/iQ92TuvBqRo", type: "standard" },
          { id: "d_5", name: "Standing Leg Curl", pl: "Uginanie nóg stojąc/leżąc", sets: 3, reps: "9-12", tempo: "2111", rir: "2/1/1", rest: 120, link: "https://www.youtube.com/shorts/IwcLkHuH7iw", type: "standard" },
          { id: "d_6", name: "Calf Raises", pl: "Wspięcia na palce suwnica", sets: 3, reps: "9-12", tempo: "2111", rir: "2/1/0", rest: 120, link: "https://www.youtube.com/shorts/wlqTemUXPXY", type: "standard" },
          { id: "d_7", name: "Wood Chop", pl: "Drwal (linka wyciągu)", sets: 3, reps: "7-10", tempo: "2111", rir: "2/1/1", rest: 90, link: "https://www.youtube.com/shorts/90Qh5XG6mqs", type: "standard" }
      ]
  },
  "fbw": {
      title: "FBW (Full Body)",
      warmup: [
          { name: "Groiner with rotation", pl: "Groiner z rotacją", link: "https://www.youtube.com/watch?v=_tKPIDhGPIM", reps: "10p / strona" },
          { name: "Cat cow", pl: "Koci grzbiet", link: "https://www.youtube.com/watch?v=LIVJZZyZ2qM", reps: "10p" },
          { name: "Band dislocation", pl: "Przenoszenie gumy", link: "https://www.youtube.com/results?search_query=band+dislocation", reps: "12p" },
          { name: "Y Raise", pl: "Wznosy Y", link: "https://www.youtube.com/shorts/M5DeSgxNyKQ", reps: "10p" },
          { name: "Single leg glute bridge", pl: "Wznosy bioder jednonóż", link: "https://www.youtube.com/shorts/qB_bC7-CQjI", reps: "10p" },
          { name: "Air Split Squat", pl: "Przysiad wykroczny (bez obciążenia)", link: "https://www.youtube.com/shorts/YuLqw3kHPaw", reps: "10p" }
      ],
      exercises: [
          { id: "f_1", name: "DB Press (Incline)", pl: "Wyciskanie hantli skos dodatni", sets: 3, reps: "7-10", tempo: "2011", rir: "2/2/1", rest: 120, link: "https://www.youtube.com/shorts/5orOHJL2qS4", type: "standard" },
          { id: "f_2", name: "Hip Thrust Machine", pl: "Wypychanie bioder (maszyna/sztanga)", sets: 3, reps: "7-10", tempo: "2111", rir: "2/2/1", rest: 120, link: "https://www.youtube.com/shorts/V74XWj9FXAc", type: "standard" },
          { id: "f_3", name: "Cable Horizontal Row", pl: "Wiosłowanie linką V", sets: 3, reps: "8-11", tempo: "2111", rir: "2/2/1", rest: 120, link: "https://www.youtube.com/shorts/T__GM6KXJqQ", type: "standard" },
          { id: "f_4", name: "Leg Curl Lying", pl: "Uginanie nóg leżąc (maszyna)", sets: 3, reps: "9-12", tempo: "2011", rir: "2/1/1", rest: 120, link: "https://www.youtube.com/shorts/FMCq0hT3KRU", type: "standard" },
          { id: "f_5", name: "Chest Butterfly", pl: "Rozpiętki (maszyna)", sets: 3, reps: "9-12", tempo: "2111", rir: "2/1/1", rest: 120, link: "https://www.youtube.com/shorts/a9vQ_hwIksU", type: "standard" },
          { id: "f_6", name: "Facepull", pl: "Przyciąganie linki do twarzy", sets: 3, reps: "9-12", tempo: "2111", rir: "2/1/1", rest: 120, link: "https://www.youtube.com/watch?v=7nUMdDOEU5g", type: "standard" },
          { id: "f_7", name: "Overhead Tricep Extension", pl: "Wyciskanie francuskie (hantel/linka)", sets: 3, reps: "9-12", tempo: "2111", rir: "2/1/0", rest: 120, link: "https://www.youtube.com/shorts/9Ark9S11uXw", type: "standard" },
          { id: "f_8", name: "EZ bar preacher curls", pl: "Modlitewnik Biceps", sets: 3, reps: "9-12", tempo: "2111", rir: "2/1/0", rest: 120, link: "https://www.youtube.com/shorts/iewjVsYp8Hw", type: "standard" },
          { id: "f_9", name: "AB crunch machine", pl: "Skłony na maszynie", sets: 3, reps: "9-12", tempo: "2111", rir: "2/1/0", rest: 120, link: "https://www.youtube.com/shorts/DZXazOVQgh0", type: "standard" }
      ]
  }
};