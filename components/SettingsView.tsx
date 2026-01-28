import React, { useContext, useState, useRef } from 'react';
import { AppContext } from '../App';
import { storage } from '../services/storage';
import { DEFAULT_WORKOUTS, CLIENT_CONFIG } from '../constants';
import { Exercise, WorkoutPlan, BodyMeasurement, CardioSession, WorkoutHistoryEntry } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

declare var html2pdf: any;

export default function SettingsView() {
  const { settings, updateSettings, playAlarm, workouts, updateWorkouts, logo } = useContext(AppContext);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>("");
  const [editingExerciseIdx, setEditingExerciseIdx] = useState<number | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Helper do bezpiecznej aktualizacji stanu (immutable update)
  const updatePlanExercises = (workoutId: string, newExercises: Exercise[]) => {
    const newWorkouts = { ...workouts };
    newWorkouts[workoutId] = {
        ...newWorkouts[workoutId],
        exercises: newExercises
    };
    updateWorkouts(newWorkouts);
  };

  // --- Exercise Editor Sub-logic ---
  const handleEditSave = (updatedEx: Exercise) => {
    if (!selectedWorkoutId || editingExerciseIdx === null) return;
    
    const currentExercises = [...workouts[selectedWorkoutId].exercises];
    currentExercises[editingExerciseIdx] = updatedEx;
    
    updatePlanExercises(selectedWorkoutId, currentExercises);
    setEditingExerciseIdx(null);
  };

  const handleDeleteExercise = (idx: number) => {
    if (!window.confirm("Usunąć trwale?")) return;
    
    const currentExercises = [...workouts[selectedWorkoutId].exercises];
    currentExercises.splice(idx, 1);
    
    updatePlanExercises(selectedWorkoutId, currentExercises);
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
    
    const currentExercises = [...workouts[selectedWorkoutId].exercises];
    currentExercises.push(newEx);
    
    updatePlanExercises(selectedWorkoutId, currentExercises);
    setEditingExerciseIdx(currentExercises.length - 1);
  };

  const handleReset = () => {
    if (!selectedWorkoutId) return;
    if (window.confirm("Przywrócić domyślne ćwiczenia dla tego planu?")) {
      const newWorkouts = { ...workouts };
      // Głęboka kopia domyślnego planu, aby odciąć referencje
      newWorkouts[selectedWorkoutId] = JSON.parse(JSON.stringify(DEFAULT_WORKOUTS[selectedWorkoutId]));
      updateWorkouts(newWorkouts);
      setEditingExerciseIdx(null);
    }
  };

  const handleMove = (idx: number, dir: number) => {
    if (!selectedWorkoutId) return;
    
    const exercises = [...workouts[selectedWorkoutId].exercises];
    const newIdx = idx + dir;
    
    if (newIdx >= 0 && newIdx < exercises.length) {
        [exercises[idx], exercises[newIdx]] = [exercises[newIdx], exercises[idx]];
        updatePlanExercises(selectedWorkoutId, exercises);
    }
  };

  // --- Backup Logic ---
  const handleExport = () => {
    storage.saveWorkouts(workouts);

    const data: any = {};
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

  // --- Report Helpers ---
  const getExerciseChartData = (workoutId: string, exerciseId: string) => {
    const history = storage.getHistory(workoutId);
    if (!history || history.length < 2) return []; // Min 2 points for chart

    return history.slice().reverse().map(entry => {
      const resultStr = entry.results[exerciseId];
      if (!resultStr) return null;

      const matches = resultStr.matchAll(/(\d+(?:[.,]\d+)?)\s*kg/gi);
      let maxWeight = 0;
      let found = false;

      for (const match of matches) {
        const weightVal = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(weightVal)) {
          if (weightVal > maxWeight) maxWeight = weightVal;
          found = true;
        }
      }

      if (!found) return null;

      return {
        date: entry.date.split(',')[0].slice(0,5), // Short date DD.MM
        weight: maxWeight
      };
    }).filter(Boolean);
  };

  const getMeasurementsData = () => {
    const m = storage.getMeasurements();
    if(m.length < 2) return [];
    return m.slice().reverse().map(item => ({
        date: item.date.slice(5), // Remove Year for chart clarity
        weight: parseFloat(item.weight) || 0
    })).filter(d => d.weight > 0);
  };

  const getCardioSummary = () => {
    const s = storage.getCardioSessions();
    if(s.length === 0) return { count: 0, range: "Brak danych" };
    
    const dates = s.map(i => new Date(i.date).getTime());
    const min = new Date(Math.min(...dates)).toLocaleDateString();
    const max = new Date(Math.max(...dates)).toLocaleDateString();
    return {
        count: s.length,
        range: min === max ? min : `${min} - ${max}`
    };
  };

  // --- Full Report Generation ---
  const handleGenerateReport = () => {
    if (!reportRef.current) return;
    setIsGeneratingReport(true);

    const element = reportRef.current;
    const opt = {
      margin:       0,
      filename:     `Raport_Calkowity_${CLIENT_CONFIG.name.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    setTimeout(() => {
        html2pdf().set(opt).from(element).save().then(() => {
            setIsGeneratingReport(false);
        });
    }, 1000); // Dłuższy timeout aby wykresy zdążyły się wyrenderować
  };

  return (
    <div className="animate-fade-in pb-10 relative">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Ustawienia</h2>

      {/* Backup Section */}
      <div className="bg-[#1e1e1e] rounded-xl shadow-md p-5 mb-6 border-l-4 border-blue-600">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <i className="fas fa-save text-blue-500 mr-2"></i>Kopia zapasowa (JSON)
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

      {/* Reports Section */}
      <div className="bg-[#1e1e1e] rounded-xl shadow-md p-5 mb-6 border-l-4 border-green-600">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <i className="fas fa-file-pdf text-green-500 mr-2"></i>Raporty
        </h3>
        <p className="text-sm text-gray-400 mb-4">
            Wygeneruj pełny raport zawierający pomiary ciała (z wykresem), historię cardio oraz dziennik treningowy z wykresami postępu.
        </p>
        <button 
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="w-full bg-green-700 hover:bg-green-600 text-white p-4 rounded-lg flex items-center justify-center transition font-bold shadow-lg"
        >
            {isGeneratingReport ? (
                <span className="flex items-center"><i className="fas fa-spinner fa-spin mr-2"></i> Generowanie...</span>
            ) : (
                <span className="flex items-center"><i className="fas fa-file-contract mr-2 text-xl"></i> POBIERZ PEŁNY RAPORT PDF</span>
            )}
        </button>
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
            {(Object.entries(workouts) as [string, WorkoutPlan][]).map(([id, data]) => (
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

      {/* HIDDEN REPORT TEMPLATE (OFF-SCREEN) */}
      <div className="absolute top-0 left-[-9999px]">
        <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-[#121212] text-white font-sans">
            {/* Header */}
            <div className="bg-[#1e1e1e] p-8 border-b-4 border-red-600 flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-red-600 bg-black">
                        <img 
                            src={logo} 
                            alt="Logo" 
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src='https://img.icons8.com/ios-filled/100/ef4444/bear.png'; }} 
                        />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-wider">BEAR GYM</h1>
                        <p className="text-gray-400 text-sm mt-1">RAPORT POSTĘPÓW</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold">{CLIENT_CONFIG.name}</h2>
                    <p className="text-gray-400 text-xs">Data: {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            <div className="px-8 pb-8 space-y-12">
                
                {/* SECTION 1: MEASUREMENTS */}
                <section className="break-inside-avoid page-break-after-auto">
                    <div className="flex justify-between items-center border-b border-green-800 pb-2 mb-6">
                        <h2 className="text-xl font-bold text-green-500 flex items-center">
                            <i className="fas fa-ruler-combined mr-2"></i> Pomiary Ciała
                        </h2>
                    </div>

                    {/* Measurement Chart */}
                    {getMeasurementsData().length > 1 && (
                        <div className="bg-[#181818] p-4 rounded border border-gray-800 mb-6 break-inside-avoid">
                            <h4 className="text-xs text-gray-400 mb-2 uppercase font-bold text-center">Zmiana Wagi (kg)</h4>
                            <div className="h-[150px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={getMeasurementsData()}>
                                        <CartesianGrid stroke="#333" strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" stroke="#666" tick={{fill: '#888', fontSize: 10}} />
                                        <YAxis domain={['auto', 'auto']} hide />
                                        <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={{r:3, fill:'#10b981'}} isAnimationActive={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="bg-[#1e1e1e] text-white uppercase text-xs">
                            <tr>
                                <th className="px-4 py-2">Data</th>
                                <th className="px-4 py-2">Waga</th>
                                <th className="px-4 py-2">Pas</th>
                                <th className="px-4 py-2">Klatka</th>
                                <th className="px-4 py-2">Biceps</th>
                                <th className="px-4 py-2">Udo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {storage.getMeasurements().length > 0 ? storage.getMeasurements().slice().reverse().map(m => (
                                <tr key={m.id} className="hover:bg-gray-900">
                                    <td className="px-4 py-2 font-bold text-white">{m.date}</td>
                                    <td className="px-4 py-2">{m.weight}</td>
                                    <td className="px-4 py-2">{m.waist}</td>
                                    <td className="px-4 py-2">{m.chest}</td>
                                    <td className="px-4 py-2">{m.biceps}</td>
                                    <td className="px-4 py-2">{m.thigh}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="px-4 py-4 text-center text-gray-500">Brak pomiarów</td></tr>
                            )}
                        </tbody>
                    </table>
                </section>

                {/* SECTION 2: CARDIO */}
                <section className="break-inside-avoid">
                    <div className="flex justify-between items-center border-b border-blue-800 pb-2 mb-6">
                        <h2 className="text-xl font-bold text-blue-500 flex items-center">
                            <i className="fas fa-heartbeat mr-2"></i> Historia Cardio
                        </h2>
                        <div className="text-xs text-gray-400">
                            Zakres: <span className="text-white font-mono ml-1">{getCardioSummary().range}</span>
                            <span className="mx-2">|</span>
                            Sesje: <span className="text-white font-mono ml-1">{getCardioSummary().count}</span>
                        </div>
                    </div>
                    
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="bg-[#1e1e1e] text-white uppercase text-xs">
                            <tr>
                                <th className="px-4 py-2">Data</th>
                                <th className="px-4 py-2">Aktywność</th>
                                <th className="px-4 py-2">Czas</th>
                                <th className="px-4 py-2">Notatki</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {storage.getCardioSessions().length > 0 ? storage.getCardioSessions().map(s => (
                                <tr key={s.id} className="hover:bg-gray-900">
                                    <td className="px-4 py-2 font-bold text-white">{s.date}</td>
                                    <td className="px-4 py-2 uppercase text-xs">{s.type}</td>
                                    <td className="px-4 py-2">{s.duration}</td>
                                    <td className="px-4 py-2 italic text-gray-500">{s.notes || '-'}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500">Brak sesji cardio</td></tr>
                            )}
                        </tbody>
                    </table>
                </section>

                {/* SECTION 3: WORKOUT LOGS */}
                <section>
                    <h2 className="text-xl font-bold text-red-500 border-b border-red-800 pb-2 mb-6 flex items-center">
                        <i className="fas fa-dumbbell mr-2"></i> Dziennik Treningowy
                    </h2>
                    
                    {Object.keys(workouts).map(wId => {
                        const history = storage.getHistory(wId);
                        const plan = workouts[wId];
                        if(history.length === 0) return null;

                        return (
                            <div key={wId} className="mb-10">
                                <h3 className="text-lg font-bold text-white bg-[#1e1e1e] p-2 border-l-4 border-red-600 mb-4 flex justify-between">
                                    {plan.title}
                                    <span className="text-xs font-normal text-gray-400 mt-1">{history.length} treningów</span>
                                </h3>

                                {/* CHARTS GRID */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {plan.exercises.map(ex => {
                                        const cData = getExerciseChartData(wId, ex.id);
                                        if (cData.length < 2) return null;
                                        return (
                                            <div key={ex.id} className="bg-[#181818] p-2 rounded border border-gray-800 break-inside-avoid">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-bold text-gray-300 truncate w-3/4">{ex.name}</span>
                                                    <span className="text-[8px] text-red-500">{Math.max(...cData.map(d=>d.weight))}kg</span>
                                                </div>
                                                <div className="h-[60px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={cData}>
                                                            <Line type="monotone" dataKey="weight" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="space-y-4">
                                    {history.map((session, sIdx) => (
                                        <div key={sIdx} className="border border-gray-800 rounded bg-[#181818] p-3 break-inside-avoid">
                                            <div className="flex justify-between items-center mb-2 border-b border-gray-800 pb-1">
                                                <span className="font-bold text-white text-sm">{session.date}</span>
                                            </div>
                                            <div className="grid grid-cols-1 gap-1">
                                                {Object.entries(session.results).map(([exId, res]) => {
                                                    const exName = plan.exercises.find(e => e.id === exId)?.name || exId;
                                                    return (
                                                        <div key={exId} className="text-xs flex justify-between">
                                                            <span className="text-gray-400 truncate w-1/2">{exName}:</span>
                                                            <span className="text-gray-200 font-mono w-1/2 text-right">{res}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </section>
                
                <div className="mt-10 text-center text-gray-600 text-[10px] border-t border-gray-800 pt-4">
                    Wygenerowano przez Bear Gym App | {new Date().getFullYear()}
                </div>
            </div>
        </div>
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