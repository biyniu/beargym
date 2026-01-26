import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { storage } from '../services/storage';
import { WorkoutHistoryEntry } from '../types';

export default function HistoryView() {
  const { workouts } = useContext(AppContext);
  const workoutIds = Object.keys(workouts);
  const [openSessions, setOpenSessions] = useState<{ [key: string]: boolean }>({});

  const toggleSession = (uniqueId: string) => {
    setOpenSessions(prev => ({ ...prev, [uniqueId]: !prev[uniqueId] }));
  };

  return (
    <div className="animate-fade-in pb-10">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Historia</h2>
      
      {workoutIds.length === 0 && <p className="text-center text-gray-500">Brak planów treningowych.</p>}

      {workoutIds.map(wId => {
        const history: WorkoutHistoryEntry[] = storage.getHistory(wId);
        const planData = workouts[wId];
        
        if (history.length === 0) return null;

        return (
          <div key={wId} className="mb-8">
             <h3 className="text-xl font-bold text-red-500 mb-3 pl-3 border-l-4 border-red-500">{planData.title}</h3>
             <div className="space-y-3">
               {history.map((session, idx) => {
                 const uniqueId = `${wId}_${idx}`;
                 const isOpen = openSessions[uniqueId];

                 return (
                   <div key={uniqueId} className="bg-[#1e1e1e] rounded-xl overflow-hidden shadow">
                     <button 
                       onClick={() => toggleSession(uniqueId)}
                       className="w-full p-4 flex justify-between items-center bg-gray-800 hover:bg-gray-700 transition"
                     >
                        <span className="font-bold text-white">{session.date}</span>
                        <i className={`fas fa-chevron-down text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
                     </button>
                     
                     {isOpen && (
                       <div className="bg-gray-900 p-4 border-t border-gray-700 text-sm animate-fade-in">
                         <ul className="space-y-2">
                           {Object.entries(session.results).map(([exId, res]) => {
                             const exName = planData.exercises.find(e => e.id === exId)?.name || exId;
                             return (
                               <li key={exId} className="border-b border-gray-800 pb-2 flex justify-between last:border-0">
                                 <div className="text-gray-400 text-xs w-1/2 pr-2">{exName}</div>
                                 <div className="text-white font-mono text-xs w-1/2 text-right">{res}</div>
                               </li>
                             );
                           })}
                         </ul>
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
          </div>
        );
      })}
    </div>
  );
}