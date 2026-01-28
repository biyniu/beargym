import React, { useContext, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { storage } from '../services/storage';
import { CLIENT_CONFIG } from '../constants';
import { WorkoutPlan } from '../types';

export default function Dashboard() {
  const { workouts, logo, updateLogo } = useContext(AppContext);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if(ev.target?.result) updateLogo(ev.target.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const getLastDate = (id: string) => {
    const history = storage.getHistory(id);
    return history.length > 0 ? history[0].date : 'Nigdy';
  };

  return (
    <div className="animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col items-center mb-6">
        <div 
          onClick={() => fileInputRef.current?.click()} 
          className="cursor-pointer relative group w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mb-4 overflow-hidden border-4 border-red-600 shadow-xl transition-all hover:shadow-red-900/50"
        >
          <img 
            src={logo} 
            alt="Logo"
            onError={(e) => { (e.target as HTMLImageElement).src='https://img.icons8.com/ios-filled/100/ef4444/bear.png'; }} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
            <i className="fas fa-camera text-white text-2xl"></i>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">{CLIENT_CONFIG.name} - Trening</h2>
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          className="hidden" 
          onChange={handleLogoUpload} 
        />
      </div>

      {/* WORKOUT LIST */}
      <div className="grid gap-4 mb-6">
        {(Object.entries(workouts) as [string, WorkoutPlan][]).map(([id, data]) => (
          <button 
            key={id}
            onClick={() => navigate(`/workout/${id}`)} 
            className="bg-[#1e1e1e] rounded-xl shadow-md p-6 flex items-center justify-between border-l-4 border-red-500 hover:bg-gray-800 transition transform active:scale-95 group"
          >
            <div className="text-left">
              <h2 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">{data.title}</h2>
              <span className="text-gray-500 text-xs flex items-center mt-1">
                <i className="fas fa-clock mr-1"></i> Ostatnio: {getLastDate(id)}
              </span>
            </div>
            <i className="fas fa-chevron-right text-gray-600 group-hover:text-white transition-colors"></i>
          </button>
        ))}
      </div>

      {/* CALENDAR WIDGET */}
      <div className="mb-6">
        <CalendarWidget workouts={workouts} logo={logo} />
      </div>

      {/* ANALYSIS & EXTRAS NAVIGATION */}
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/history')} 
            className="bg-[#1e1e1e] rounded-xl shadow p-4 text-gray-400 hover:text-white flex flex-col items-center justify-center transition border border-transparent hover:border-gray-600"
          >
            <i className="fas fa-history mb-2 text-2xl"></i> 
            <span className="text-sm">Pełna historia</span>
          </button>
          
          <button 
            onClick={() => navigate('/progress')} 
            className="bg-[#1e1e1e] rounded-xl shadow p-4 text-blue-400 hover:text-blue-300 flex flex-col items-center justify-center transition border border-transparent hover:border-blue-900"
          >
            <i className="fas fa-chart-line mb-2 text-2xl"></i> 
            <span className="text-sm">Wykresy postępu</span>
          </button>
        </div>

        <button 
            onClick={() => navigate('/measurements')} 
            className="w-full bg-[#1e1e1e] rounded-xl shadow p-4 text-green-400 hover:text-green-300 flex items-center justify-center transition border border-transparent hover:border-green-900"
        >
            <i className="fas fa-ruler-combined text-2xl mr-3"></i>
            <span className="font-bold">Pomiary Ciała</span>
        </button>
        
        <button 
            onClick={() => navigate('/cardio')} 
            className="w-full bg-[#1e1e1e] rounded-xl shadow p-4 text-red-400 hover:text-red-300 flex flex-col items-center justify-center transition border border-transparent hover:border-red-900"
        >
            <i className="fas fa-heartbeat text-2xl mb-2"></i>
            <span className="text-sm font-bold">Log Cardio</span>
        </button>
      </div>
    </div>
  );
}

// --- CALENDAR WIDGET ---
function CalendarWidget({ workouts, logo }: { workouts: any, logo: string }) {
    const [viewDate, setViewDate] = useState(new Date());
    
    // Polskie nazwy miesięcy
    const months = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
    const daysShort = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

    // Pobranie wszystkich dat treningów (zarówno siłowe jak i cardio)
    const activeDates = useMemo(() => {
        const dates = new Set<string>();
        
        // 1. Historia siłowa
        Object.keys(workouts).forEach(id => {
            const hist = storage.getHistory(id);
            hist.forEach(h => {
                // format: "DD.MM.YYYY (HH:MM)" -> weź "DD.MM.YYYY"
                const datePart = h.date.split(' ')[0];
                dates.add(datePart);
            });
        });

        // 2. Historia Cardio
        const cardio = storage.getCardioSessions();
        cardio.forEach(c => {
            // format: "YYYY-MM-DD" -> konwersja na "DD.MM.YYYY"
            const [y, m, d] = c.date.split('-');
            // Konwersja na format z apki siłowej dla spójności
            dates.add(`${d}.${m}.${y}`);
        });

        return dates;
    }, [workouts, viewDate]); // Odśwież gdy zmienią się treningi

    // Nawigacja
    const prevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };
    const nextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    // Generowanie siatki
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Pobranie dnia tygodnia dla 1. dnia miesiąca (0=Nd, 1=Pn...)
    let firstDayIndex = new Date(year, month, 1).getDay();
    // Konwersja na system gdzie Pn=0, ..., Nd=6
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days = [];
    // Puste pola przed 1 dniem
    for(let i=0; i<firstDayIndex; i++) {
        days.push(null);
    }
    // Dni miesiąca
    for(let i=1; i<=daysInMonth; i++) {
        days.push(i);
    }

    const isToday = (d: number) => {
        const today = new Date();
        return d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    const hasWorkout = (d: number) => {
        const dStr = d.toString().padStart(2, '0');
        const mStr = (month + 1).toString().padStart(2, '0');
        const checkDate = `${dStr}.${mStr}.${year}`;
        return activeDates.has(checkDate);
    };

    return (
        <div className="bg-[#1e1e1e] rounded-xl shadow-md p-4 border border-gray-800 relative overflow-hidden">
            {/* Dekoracja tła */}
            <div className="absolute top-[-20px] right-[-20px] text-gray-800 opacity-20 transform rotate-12">
                 <i className="fas fa-calendar-alt text-8xl"></i>
            </div>

            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2 relative z-10">
                <button onClick={prevMonth} className="text-gray-400 hover:text-white p-2"><i className="fas fa-chevron-left"></i></button>
                <div className="text-white font-bold text-lg uppercase tracking-wide">
                    {months[month]} <span className="text-red-500">{year}</span>
                </div>
                <button onClick={nextMonth} className="text-gray-400 hover:text-white p-2"><i className="fas fa-chevron-right"></i></button>
            </div>

            {/* Dni tygodnia */}
            <div className="grid grid-cols-7 gap-1 mb-2 text-center relative z-10">
                {daysShort.map(d => (
                    <div key={d} className="text-[10px] text-gray-500 font-bold uppercase">{d}</div>
                ))}
            </div>

            {/* Siatka dni */}
            <div className="grid grid-cols-7 gap-1 relative z-10">
                {days.map((day, idx) => {
                    if (day === null) return <div key={`empty-${idx}`} className="aspect-square"></div>;
                    
                    const trained = hasWorkout(day);
                    const today = isToday(day);

                    return (
                        <div 
                            key={day} 
                            className={`
                                aspect-square rounded-lg flex items-center justify-center relative border transition overflow-hidden
                                ${today ? 'border-red-500 bg-gray-800' : 'border-gray-800 bg-[#121212]'}
                                ${trained ? 'cursor-pointer border-green-600/50' : ''}
                            `}
                        >
                            {/* Pokaż numer dnia TYLKO jeśli NIE ma treningu */}
                            {!trained && (
                                <span className="text-xs font-bold z-10 relative text-gray-500">
                                    {day}
                                </span>
                            )}
                            
                            {/* LOGO JAKO NAKLEJKA */}
                            {trained && (
                                <div className="absolute inset-0 w-full h-full">
                                    <img 
                                        src={logo} 
                                        alt="" 
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).src='https://img.icons8.com/ios-filled/100/ef4444/bear.png'; }} 
                                    />
                                    {/* Mały znacznik (check) w rogu */}
                                    <div className="absolute bottom-0 right-0 bg-black/60 px-1 rounded-tl text-[8px] text-green-400">
                                        <i className="fas fa-check"></i>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-3 flex justify-center items-center space-x-4 text-[10px] text-gray-500 relative z-10">
                 <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div> Dzisiaj</div>
                 <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div> Trening</div>
            </div>
        </div>
    );
}