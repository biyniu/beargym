import React, { useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { storage } from '../services/storage';
import { CLIENT_CONFIG } from '../constants';

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

      <div className="grid gap-4">
        {Object.entries(workouts).map(([id, data]) => (
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

        <div className="grid grid-cols-2 gap-4 mt-4">
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
            className="w-full bg-[#1e1e1e] rounded-xl shadow p-4 text-red-400 hover:text-red-300 flex items-center justify-center transition border border-transparent hover:border-red-900"
        >
            <i className="fas fa-heartbeat text-2xl mr-3"></i>
            <span className="font-bold">Log Cardio</span>
        </button>
      </div>
    </div>
  );
}