import React, { useContext, useState, useRef } from 'react';
import { AppContext } from '../App';
import { DEFAULT_WORKOUTS, CLIENT_CONFIG } from '../constants';
import { Exercise } from '../types';

export default function SettingsView() {
  const { settings, updateSettings, playAlarm, workouts, updateWorkouts } = useContext(AppContext);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>("");
  const [editingExerciseIdx, setEditingExerciseIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Exercise Editor Sub-logic ---
  const handleEditSave = (updatedEx: Exercise) => {
    if (!selectedWorkoutId || editingExerciseIdx === null) return;
    const newWorkouts = { ...workouts };
    newWorkouts[selectedWorkoutId].exercises[editingExerciseIdx] = updatedEx;
    updateWorkouts(newWorkouts);
    setEditingExerciseIdx(null);
  };

  const handleDeleteExercise = (idx: number) => {
    if (!window.confirm("Usunąć trwale?")) return;
    const newWorkouts = { ...workouts };
    newWorkouts[selectedWorkoutId].exercises.splice(idx, 1);
    updateWorkouts(newWorkouts);
    setEditingExerciseIdx(null);
  };

  const handleAddExercise = () => {
    if (!selectedWorkoutId) return;
    const newEx: Exercise = { 
      id: `custom_${Date.now()}`, 
      name: "Nowe ćwiczenie", 
      pl: "Opis...", 
      sets: 3, 
      reps: "10", 
      tempo: "2011", 
      rir: "1", 
      rest: 90, 
      link: "", 
      type: "standard" 
    };
    const newWorkouts = { ...workouts };
    newWorkouts[selectedWorkoutId].exercises.push(newEx);
    updateWorkouts(newWorkouts);
    setEditingExerciseIdx(newWorkouts[selectedWorkoutId].exercises.length - 1);
  };

  const handleReset = () => {
    if (!selectedWorkoutId) return;
    if (window.confirm("Przywrócić domyślne ćwiczenia dla tego planu?")) {
      const newWorkouts = { ...workouts };
      // Copy default to break ref
      newWorkouts[selectedWorkoutId] = JSON.parse(JSON.stringify(DEFAULT_WORKOUTS[selectedWorkoutId]));
      updateWorkouts(newWorkouts);
      setEditingExerciseIdx(null);
    }
  };

  const handleMove = (idx: number, dir: number) => {
    if (!selectedWorkoutId) return;
    const exercises = [...workouts[selectedWorkoutId].exercises];
    const newIdx = idx + dir;
    [exercises[idx], exercises[newIdx]] = [exercises[newIdx], exercises[idx]];
    const newWorkouts = { ...workouts };
    newWorkouts[selectedWorkoutId].exercises = exercises;
    updateWorkouts(newWorkouts);
  };

  // --- Backup Logic ---
  const handleExport = () => {
    const data: any = {};
    // Iterate localStorage and grab keys related to this app
    for(let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if(key && (key.startsWith(CLIENT_CONFIG.storageKey) || key === 'app_settings')) {
            data[key] = localStorage.getItem(key);
        }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {type : 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${CLIENT_CONFIG.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;

    if(!window.confirm("To nadpisze obecne dane treningowe. Kontynuować?")) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target?.result as string);
            Object.keys(data).forEach(key => {
                localStorage.setItem(key, data[key]);
            });
            alert("Dane zaimportowane pomyślnie! Strona zostanie odświeżona.");
            window.location.reload();
        } catch(err) {
            alert("Błąd importu pliku.");
        }
    };
    reader.readAsText(file);
  };

  return (
    <div className="animate-fade-in pb-10">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Ustawienia</h2>

      {/* Backup Section */}
      <div className="bg-[#1e1e1e] rounded-xl shadow-md p-5 mb-6 border-l-4 border-blue-600">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <i className="fas fa-save text-blue-500 mr-2"></i>Kopia zapasowa
        </h3>
        <div className="grid grid-cols-2 gap-4">
            <button 
                onClick={handleExport}
                className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded flex flex-col items-center justify-center transition"
            >
                <i className="fas fa-file-download text-2xl mb-2"></i>
                <span className="text-sm font-bold">Eksportuj</span>
            </button>
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded flex flex-col items-center justify-center transition"
            >
                <i className="fas fa-file-upload text-2xl mb-2"></i>
                <span className="text-sm font-bold">Importuj</span>
            </button>
        </div>
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".json" 
            onChange={handleImport} 
        />
        <p className="text-xs text-gray-500 mt-3 text-center">Pobierz plik, aby przenieść dane na inne urządzenie.</p>
      </div>

      {/* Sound Settings */}
      <div className="bg-[#1e1e1e] rounded-xl shadow-md p-5 mb-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <i className="fas fa-volume-up text-red-500 mr-2"></i>Dźwięk
        </h3>
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">Głośność: {Math.round(settings.volume * 100)}%</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={settings.volume} 
            onChange={(e) => updateSettings({ ...settings, volume: parseFloat(e.target.value) })}
            className="w-full h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600" 
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">Rodzaj sygnału</label>
          <select 
            value={settings.soundType} 
            onChange={(e) => updateSettings({ ...settings, soundType: e.target.value as any })}
            className="w-full bg-gray-800 text-white p-3 rounded border border-gray-600 text-lg"
          >
            <option value="beep1">Krótki Beep</option>
            <option value="beep2">Długi Beeeep</option>
            <option value="beep3">Podwójny Beep</option>
          </select>
        </div>
        <button 
          onClick={playAlarm} 
          className="bg-gray-700 text-white px-4 py-3 rounded text-sm hover:bg-gray-600 w-full font-bold transition"
        >
          Testuj dźwięk
        </button>
      </div>

      {/* Editor */}
      <div className="bg-[#1e1e1e] rounded-xl shadow-md p-5">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <i className="fas fa-dumbbell text-red-500 mr-2"></i>Edytor Treningu
        </h3>
        
        <div className="mb-4">
          <select 
            className="w-full bg-gray-800 text-white p-3 rounded border border-gray-600 text-lg"
            value={selectedWorkoutId}
            onChange={(e) => { setSelectedWorkoutId(e.target.value); setEditingExerciseIdx(null); }}
          >
            <option value="">-- Wybierz Plan --</option>
            {Object.entries(workouts).map(([id, data]) => (
              <option key={id} value={id}>{data.title}</option>
            ))}
          </select>
        </div>

        {selectedWorkoutId && (
          <div className="border-t border-gray-700 pt-4 animate-fade-in">
             {editingExerciseIdx !== null ? (
               <ExerciseForm 
                 exercise={workouts[selectedWorkoutId].exercises[editingExerciseIdx]} 
                 onSave={handleEditSave} 
                 onCancel={() => setEditingExerciseIdx(null)}
                 onDelete={() => handleDeleteExercise(editingExerciseIdx)}
               />
             ) : (
               <>
                 <ul className="space-y-2">
                   {workouts[selectedWorkoutId].exercises.map((ex, idx) => (
                     <li key={idx} className="bg-gray-800 p-3 rounded flex justify-between items-center border border-gray-700">
                       <div className="flex-1 cursor-pointer" onClick={() => setEditingExerciseIdx(idx)}>
                         <div className="font-bold text-sm text-white">{idx+1}. {ex.name}</div>
                       </div>
                       <div className="flex space-x-2 ml-2">
                         {idx > 0 && (
                           <button onClick={() => handleMove(idx, -1)} className="text-gray-400 p-2 hover:text-white">
                             <i className="fas fa-arrow-up"></i>
                           </button>
                         )}
                         {idx < workouts[selectedWorkoutId].exercises.length - 1 && (
                            <button onClick={() => handleMove(idx, 1)} className="text-gray-400 p-2 hover:text-white">
                            <i className="fas fa-arrow-down"></i>
                          </button>
                         )}
                       </div>
                     </li>
                   ))}
                 </ul>
                 <button onClick={handleAddExercise} className="mt-4 w-full bg-green-700 hover:bg-green-600 text-white py-3 rounded font-bold shadow-lg transition">
                   DODAJ ĆWICZENIE
                 </button>
                 <button onClick={handleReset} className="mt-6 text-xs text-red-500 w-full p-2 border border-red-900 rounded hover:bg-red-900 hover:text-white transition">
                   Reset planu
                 </button>
               </>
             )}
          </div>
        )}
      </div>
    </div>
  );
}

const ExerciseForm = ({ exercise, onSave, onCancel, onDelete }: { 
  exercise: Exercise, 
  onSave: (e: Exercise) => void, 
  onCancel: () => void,
  onDelete: () => void
}) => {
  const [formData, setFormData] = useState<Exercise>({ ...exercise });

  const handleChange = (field: keyof Exercise, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-gray-800 p-4 rounded border border-gray-600 animate-fade-in">
      <h4 className="font-bold text-white mb-3 text-lg">Edycja: {formData.name}</h4>
      <div className="space-y-3 text-sm">
        <div><label className="text-gray-400">Nazwa</label><input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-700" /></div>
        <div><label className="text-gray-400">Opis PL</label><input type="text" value={formData.pl} onChange={e => handleChange('pl', e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-700" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-gray-400">Serie</label><input type="number" value={formData.sets} onChange={e => handleChange('sets', parseInt(e.target.value))} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-700" /></div>
          <div><label className="text-gray-400">Przerwa (s)</label><input type="number" value={formData.rest} onChange={e => handleChange('rest', parseInt(e.target.value))} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-700" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-gray-400">Tempo</label><input type="text" value={formData.tempo} onChange={e => handleChange('tempo', e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-700" /></div>
          <div><label className="text-gray-400">RIR</label><input type="text" value={formData.rir} onChange={e => handleChange('rir', e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-700" /></div>
        </div>
        <div><label className="text-gray-400">Zakres powtórzeń</label><input type="text" value={formData.reps} onChange={e => handleChange('reps', e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-700" /></div>
        <div><label className="text-gray-400">Link YouTube</label><input type="text" value={formData.link} onChange={e => handleChange('link', e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded border border-gray-700" /></div>
      </div>
      <div className="flex space-x-2 mt-4">
        <button onClick={() => onSave(formData)} className="flex-1 bg-green-600 text-white py-3 rounded font-bold hover:bg-green-500">ZAPISZ</button>
        <button onClick={onCancel} className="flex-1 bg-gray-600 text-white py-3 rounded hover:bg-gray-500">ANULUJ</button>
      </div>
      <button onClick={onDelete} className="w-full mt-2 bg-red-900 text-red-200 py-2 rounded text-xs flex justify-center items-center hover:bg-red-800"><i className="fas fa-trash mr-1"></i> Usuń ćwiczenie</button>
    </div>
  );
};