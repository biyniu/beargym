import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ActiveWorkout from './components/ActiveWorkout';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';
import ProgressView from './components/ProgressView';
import MeasurementsView from './components/MeasurementsView';
import CardioView from './components/CardioView';
import InstallPrompt from './components/InstallPrompt';
import { storage } from './services/storage';
import { WorkoutsMap, AppSettings } from './types';

// Simple context to share state without prop drilling everywhere
interface AppContextType {
  workouts: WorkoutsMap;
  settings: AppSettings;
  updateSettings: (s: AppSettings) => void;
  updateWorkouts: (w: WorkoutsMap) => void;
  logo: string;
  updateLogo: (s: string) => void;
  playAlarm: () => void;
}

export const AppContext = React.createContext<AppContextType>({} as AppContextType);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col relative bg-[#121212] text-[#e0e0e0] font-sans">
      <header className="p-4 flex justify-between items-center border-b border-gray-700 bg-neutral-900 sticky top-0 z-40 shadow-md">
        <div className="flex items-center space-x-2">
          <i className="fas fa-dumbbell text-red-500"></i>
          <h1 className="text-xl font-bold text-white tracking-wider">BEAR GYM</h1>
        </div>
        {!isHome && (
          <button 
            onClick={() => navigate('/')} 
            className="text-gray-300 hover:text-white bg-gray-800 px-3 py-1 rounded border border-gray-600 flex items-center"
          >
            <i className="fas fa-arrow-left mr-1"></i> Wróć
          </button>
        )}
      </header>

      <div className="p-3 space-y-4 flex-grow pb-24">
        {children}
      </div>
      
      {/* PWA Install Prompt */}
      <InstallPrompt />

      {isHome && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-slow">
           <button 
            onClick={() => navigate('/settings')} 
            className="bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-xl transition transform hover:scale-110 active:scale-90"
          >
            <i className="fas fa-cog"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [workouts, setWorkouts] = useState<WorkoutsMap>(storage.getWorkouts());
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [logo, setLogo] = useState<string>(storage.getLogo());
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
  };

  const updateWorkouts = (newWorkouts: WorkoutsMap) => {
    setWorkouts(newWorkouts);
    storage.saveWorkouts(newWorkouts);
  };

  const updateLogo = (newLogo: string) => {
    setLogo(newLogo);
    storage.saveLogo(newLogo);
  };

  const playAlarm = useCallback(() => {
    const CtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!CtxClass) return;
    
    let ctx = audioCtx;
    if (!ctx) {
      ctx = new CtxClass();
      setAudioCtx(ctx);
    }
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const type = settings.soundType;
    const now = ctx.currentTime;

    if (type === 'beep1') { 
      osc.type = 'square'; 
      osc.frequency.setValueAtTime(800, now); 
      osc.start(); 
      osc.stop(now + 0.5); 
    }
    else if (type === 'beep3') { 
      osc.type = 'square'; 
      osc.frequency.setValueAtTime(800, now); 
      osc.start(); 
      osc.stop(now + 0.2); 
      
      setTimeout(() => { 
        if(!ctx) return;
        const osc2 = ctx.createOscillator(); 
        const g2 = ctx.createGain(); 
        osc2.type = 'square'; 
        osc2.frequency.setValueAtTime(800, ctx.currentTime); 
        g2.gain.value = settings.volume; 
        osc2.connect(g2).connect(ctx.destination); 
        osc2.start(); 
        osc2.stop(ctx.currentTime + 0.2); 
      }, 300);
    } else { 
      // beep2 - long
      osc.type = 'sawtooth'; 
      osc.frequency.setValueAtTime(600, now); 
      osc.start(); 
      osc.stop(now + 1.5); 
    }

    gain.gain.setValueAtTime(settings.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + (type === 'beep2' ? 1.5 : 0.5));
    osc.connect(gain).connect(ctx.destination);
    
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }, [audioCtx, settings]);

  return (
    <AppContext.Provider value={{ workouts, settings, updateSettings, updateWorkouts, logo, updateLogo, playAlarm }}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workout/:id" element={<ActiveWorkout />} />
            <Route path="/history" element={<HistoryView />} />
            <Route path="/progress" element={<ProgressView />} />
            <Route path="/measurements" element={<MeasurementsView />} />
            <Route path="/cardio" element={<CardioView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppContext.Provider>
  );
}