import React, { useContext, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { storage } from '../services/storage';
import { Exercise } from '../types';

// Helper do formatowania czasu
const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Timer Button Component
const RestTimerButton = ({ duration, playAlarm }: { duration: number, playAlarm: () => void }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const startTimer = () => {
    if (timeLeft !== null) {
      // Stop timer
      if (intervalRef.current) clearInterval(intervalRef.current);
      setTimeLeft(null);
      return;
    }

    setTimeLeft(duration);
    intervalRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          playAlarm();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const isActive = timeLeft !== null;

  return (
    <button 
      onClick={startTimer}
      className={`rounded border border-gray-600 font-bold flex flex-col justify-center items-center transition active:scale-90 w-full h-full p-1
        ${isActive ? 'bg-red-600 text-white border-red-500 animate-pulse' : 'bg-gray-800 text-white hover:bg-gray-700'}
      `}
    >
      <span className="font-mono text-xs">{isActive ? `${timeLeft}` : `${duration}s`}</span>
      {!isActive && <i className="fas fa-clock text-[8px] mt-1"></i>}
    </button>
  );
};

// Stopwatch Component
const Stopwatch = ({ id, onChange, initialValue }: { id: string, onChange: (val: string) => void, initialValue: string }) => {
  const [time, setTime] = useState<number>(parseInt(initialValue) || 0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);

  // Aktualizuj ref callbacku, aby useEffect interwału nie musiał zależeć od zmiennego propsa onChange
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTime(t => {
          const newVal = t + 1;
          // Używamy refa, aby nie restartować interwału przy każdym renderze rodzica
          onChangeRef.current(newVal.toString());
          return newVal;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]); // Zależność tylko od isRunning

  const toggle = () => {
    if (isRunning) {
      // Stop
      setIsRunning(false);
      storage.saveTempInput(id, time.toString());
    } else {
      // Start (reset if 0 or continue?) - behaving like stop/resume
      if(time === 0) setTime(0);
      setIsRunning(true);
    }
  };

  return (
    <div className="flex space-x-2 w-full">
      <input 
        type="number" 
        value={time === 0 ? '' : time}
        onChange={(e) => {
          const val = parseInt(e.target.value) || 0;
          setTime(val);
          onChange(val.toString());
        }}
        placeholder="sek" 
        className="bg-[#2d2d2d] border border-[#404040] text-white text-center w-full p-3 rounded text-lg font-bold focus:outline-none focus:border-red-500" 
      />
      <button 
        onClick={toggle}
        className={`w-12 flex-shrink-0 rounded flex items-center justify-center text-white transition-colors ${isRunning ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600 text-red-500'}`}
      >
        <i className={`fas ${isRunning ? 'fa-stop' : 'fa-stopwatch'} fa-lg`}></i>
      </button>
    </div>
  );
};

// Main Component
export default function ActiveWorkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { workouts, playAlarm } = useContext(AppContext);
  const workoutData = id ? workouts[id] : null;
  
  // Total Workout Timer State
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  if (!workoutData || !id) return <div className="text-center p-10 text-red-500">Nie znaleziono treningu.</div>;

  const handleFinish = () => {
    const dateStr = new Date().toLocaleDateString('pl-PL', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
    let sessionResults: { [key: string]: string } = {};
    let hasData = false;

    workoutData.exercises.forEach(ex => {
      let summaryParts: string[] = [];
      for(let i=1; i<=ex.sets; i++) {
        const uid = `input_${id}_${ex.id}_s${i}`;
        const kg = storage.getTempInput(`${uid}_kg`);
        const reps = storage.getTempInput(`${uid}_reps`);
        const time = storage.getTempInput(`${uid}_time`);

        if(kg && reps) summaryParts.push(`${kg}kg x ${reps}`);
        else if(reps) summaryParts.push(`${reps}p`);
        else if(time) summaryParts.push(`${time}s`);
      }
      const note = storage.getTempInput(`note_${id}_${ex.id}`);
      if(summaryParts.length > 0) {
        let resStr = summaryParts.join(' | ');
        if(note) resStr += ` [Note: ${note}]`;
        sessionResults[ex.id] = resStr;
        hasData = true;
        // Save specific last history for quick lookup
        localStorage.setItem(`history_${id}_${ex.id}`, resStr);
      }
    });

    if(!hasData && !window.confirm("Zakończyć pusty trening?")) return;

    // Append total time to the workout note or log it? 
    // For now, we just log it in the timestamp but we could append it to a specific field later.
    // Let's modify the date string to include duration for simplicity in history view
    const timeStr = formatTime(elapsedTime);
    const finalDateStr = `${dateStr} (${timeStr})`;

    const history = storage.getHistory(id);
    history.unshift({
      date: finalDateStr,
      timestamp: Date.now(),
      results: sessionResults
    });
    storage.saveHistory(id, history);
    storage.clearTempInputs(id, workoutData.exercises);
    
    alert(`Trening zapisany! Czas: ${timeStr}`);
    navigate('/');
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white truncate max-w-[60%]">{workoutData.title}</h2>
        <div className="bg-gray-800 px-3 py-1 rounded border border-gray-600 flex items-center space-x-2">
            <i className="fas fa-stopwatch text-red-500"></i>
            <span className="font-mono text-lg font-bold text-white">{formatTime(elapsedTime)}</span>
        </div>
      </div>

      {/* Warmup Section */}
      <div className="bg-[#1e1e1e] rounded-xl shadow-md p-4 mb-8 border-l-4 border-yellow-500">
        <h3 className="font-bold text-yellow-500 mb-2 uppercase text-sm">Rozgrzewka / Aktywacja</h3>
        <ul className="space-y-2">
          {workoutData.warmup.map((item, idx) => (
            <li key={idx} className="flex justify-between text-sm items-center border-b border-gray-700 py-1 last:border-0">
              <span><span className="text-gray-500 mr-1">{idx+1}.</span> {item.pl}</span>
              <div className="flex items-center space-x-3">
                <span className="text-gray-400 text-xs">{item.reps}</span>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noreferrer" className="text-red-500 hover:text-red-400">
                    <i className="fab fa-youtube"></i>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Exercises */}
      <div className="space-y-6">
        {workoutData.exercises.map((ex, idx) => (
          <ExerciseCard 
            key={ex.id} 
            exercise={ex} 
            workoutId={id} 
            index={idx+1} 
            playAlarm={playAlarm} 
          />
        ))}
      </div>

      <div className="mt-12 mb-8 px-4">
        <button 
          onClick={handleFinish} 
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition transform active:scale-95 flex items-center justify-center"
        >
          <i className="fas fa-check-circle mr-2"></i> ZAKOŃCZ I ZAPISZ TRENING
        </button>
      </div>
    </div>
  );
}

// Subcomponent for better performance
// Wrapped in React.memo to prevent unnecessary re-renders when the main clock ticks
const ExerciseCard = React.memo(({ exercise, workoutId, index, playAlarm }: { exercise: Exercise, workoutId: string, index: number, playAlarm: () => void }) => {
  const lastResult = storage.getLastResult(workoutId, exercise.id);
  const noteId = `note_${workoutId}_${exercise.id}`;
  const [note, setNote] = useState(storage.getTempInput(noteId));
  // Wersja do wymuszania przerysowania inputów po kliknięciu "Wypełnij"
  const [fillVersion, setFillVersion] = useState(0);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
    storage.saveTempInput(noteId, e.target.value);
  };

  const handleFillWeights = () => {
    if (!lastResult) return;
    
    // Szukamy wszystkich ciężarów w stringu (np. "100kg x 5 | 105kg x 5")
    const matches = Array.from(lastResult.matchAll(/(\d+(?:[.,]\d+)?)\s*kg/gi));
    
    if (matches.length === 0) {
        alert("Nie znaleziono ciężarów w ostatnim wyniku.");
        return;
    }

    let filledCount = 0;
    for(let i=1; i<=exercise.sets; i++) {
        // Jeśli mamy mniej wyników z historii niż serii, używamy ostatniego znalezionego
        const matchIndex = Math.min(i-1, matches.length - 1);
        const weight = matches[matchIndex][1]; // Grupa 1 to liczba
        
        // Zapisz do storage
        const uid = `input_${workoutId}_${exercise.id}_s${i}`;
        storage.saveTempInput(`${uid}_kg`, weight);
        // Nie ruszamy pola reps (zostaje puste lub stare jeśli coś wpisano)
        filledCount++;
    }

    if(filledCount > 0) {
        // Wymuś odświeżenie komponentów SavedInput poprzez zmianę klucza
        setFillVersion(v => v + 1);
    }
  };

  return (
    <div className="bg-[#1e1e1e] rounded-xl shadow-md p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <span className="text-red-500 font-bold text-xs uppercase">Ćwiczenie {index}</span>
          <h3 className="font-bold text-lg text-white">{exercise.name}</h3>
          <p className="text-gray-400 text-sm italic mb-2">{exercise.pl}</p>
        </div>
        {exercise.link && (
          <a href={exercise.link} target="_blank" rel="noreferrer" className="text-red-600 hover:text-red-500 p-2">
            <i className="fab fa-youtube fa-2x"></i>
          </a>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1 text-[10px] text-center mb-4 bg-black bg-opacity-20 p-2 rounded">
        <div><div className="text-gray-500">TEMPO</div><div className="text-blue-400 font-mono">{exercise.tempo}</div></div>
        <div><div className="text-gray-500">RIR</div><div className="text-blue-400 font-mono">{exercise.rir}</div></div>
        <div><div className="text-gray-500">ZAKRES</div><div className="text-green-400 font-mono">{exercise.reps}</div></div>
        <div className="h-full">
           <RestTimerButton duration={exercise.rest} playAlarm={playAlarm} />
        </div>
      </div>

      <div className="bg-gray-900 bg-opacity-50 p-2 rounded text-[10px] mb-3 border border-gray-800 flex justify-between items-center">
        <div>
            <span className="text-red-400 font-bold">OSTATNIO:</span> <span className="text-gray-400">{lastResult || 'Brak danych'}</span>
        </div>
        {lastResult && exercise.type === 'standard' && (
            <button 
                onClick={handleFillWeights}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded border border-gray-600 flex items-center"
            >
                <i className="fas fa-copy mr-1"></i> Ciężar
            </button>
        )}
      </div>

      <div className="space-y-1">
        {Array.from({ length: exercise.sets }).map((_, sIdx) => {
          const setNum = sIdx + 1;
          const uId = `input_${workoutId}_${exercise.id}_s${setNum}`;
          
          return (
            <div key={setNum} className="flex items-center py-2 space-x-2 border-b border-gray-800 last:border-0">
              <span className="text-gray-500 text-xs w-6 font-bold pt-1">S{setNum}</span>
              <div className={`flex-grow grid ${exercise.type === 'standard' ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                {exercise.type === 'standard' && (
                  <>
                     <SavedInput key={`${uId}_kg_${fillVersion}`} id={`${uId}_kg`} placeholder="kg" />
                     <SavedInput key={`${uId}_reps_${fillVersion}`} id={`${uId}_reps`} placeholder="powt" />
                  </>
                )}
                {exercise.type === 'reps_only' && (
                   <SavedInput key={`${uId}_reps_${fillVersion}`} id={`${uId}_reps`} placeholder="powt" />
                )}
                {exercise.type === 'time' && (
                  <Stopwatch 
                    id={`${uId}_time`} 
                    initialValue={storage.getTempInput(`${uId}_time`)} 
                    onChange={(val) => storage.saveTempInput(`${uId}_time`, val)} 
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <textarea 
        value={note}
        onChange={handleNoteChange}
        className="w-full mt-3 bg-[#2d2d2d] text-gray-300 text-xs p-2 rounded border border-gray-700 focus:border-red-500 focus:outline-none" 
        placeholder="Notatki..." 
        rows={1} 
      />
    </div>
  );
});

const SavedInput = ({ id, placeholder }: { id: string, placeholder: string }) => {
  const [val, setVal] = useState(storage.getTempInput(id));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVal(e.target.value);
    storage.saveTempInput(id, e.target.value);
  };

  return (
    <input 
      type="number" 
      value={val} 
      onChange={handleChange}
      placeholder={placeholder} 
      className="bg-[#2d2d2d] border border-[#404040] text-white text-center w-full p-3 rounded text-lg font-bold focus:outline-none focus:border-red-500" 
    />
  );
};