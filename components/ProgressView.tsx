import React, { useContext, useState, useMemo, useRef } from 'react';
import { AppContext } from '../App';
import { storage } from '../services/storage';
import { CLIENT_CONFIG } from '../constants';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Deklaracja dla globalnej biblioteki załadowanej w index.html
declare var html2pdf: any;

export default function ProgressView() {
  const { workouts } = useContext(AppContext);
  const workoutIds = Object.keys(workouts);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>(workoutIds[0] || "");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Funkcja pomocnicza do pobierania danych dla konkretnego ćwiczenia
  const getExerciseData = (workoutId: string, exerciseId: string) => {
    const history = storage.getHistory(workoutId);
    if (!history || history.length === 0) return [];

    // Odwracamy historię (najstarsze pierwsze) dla wykresu
    return history.slice().reverse().map(entry => {
      const resultStr = entry.results[exerciseId];
      if (!resultStr) return null;

      // Zmieniony Regex: akceptuje opcjonalną spację przed "kg" (np. "100 kg" i "100kg")
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
        date: entry.date.split(',')[0], // Tylko data, bez godziny
        weight: maxWeight,
        fullDate: entry.date
      };
    }).filter(Boolean);
  };

  const handleExportPDF = () => {
    if (!contentRef.current) return;
    setIsGeneratingPdf(true);

    const element = contentRef.current;
    const opt = {
      margin:       [10, 10],
      filename:     `Raport_${CLIENT_CONFIG.name.replace(/\s+/g, '_')}_${selectedWorkoutId}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Małe opóźnienie dla efektu UI
    setTimeout(() => {
        html2pdf().set(opt).from(element).save().then(() => {
            setIsGeneratingPdf(false);
        });
    }, 100);
  };

  // Komponent do rysowania etykiet nad punktami
  const CustomLabel = (props: any) => {
    const { x, y, value } = props;
    return (
      <text 
        x={x} 
        y={y - 10} 
        fill="#fff" 
        textAnchor="middle" 
        fontSize={10} 
        fontWeight="bold"
      >
        {value}kg
      </text>
    );
  };

  const currentWorkout = workouts[selectedWorkoutId];

  return (
    <div className="animate-fade-in pb-20">
      
      {/* Panel sterowania - widoczny tylko w aplikacji, nie w PDF */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white text-center md:text-left">Wykresy Postępu</h2>
        
        <div className="flex gap-2 w-full md:w-auto">
            <select 
                value={selectedWorkoutId} 
                onChange={(e) => setSelectedWorkoutId(e.target.value)}
                className="flex-grow bg-gray-800 text-white p-3 rounded-lg border border-gray-600 focus:border-red-500 outline-none"
            >
                {Object.entries(workouts).map(([id, data]) => (
                <option key={id} value={id}>{data.title}</option>
                ))}
            </select>
            
            <button 
                onClick={handleExportPDF}
                disabled={isGeneratingPdf}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-bold shadow transition flex items-center justify-center whitespace-nowrap"
            >
                {isGeneratingPdf ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-pdf mr-2"></i>}
                PDF
            </button>
        </div>
      </div>

      {/* Kontener treści do eksportu */}
      <div ref={contentRef} className="bg-[#121212] p-2 md:p-4 rounded-xl">
        
        {/* Nagłówek widoczny w PDF */}
        <div className="mb-6 text-center border-b border-gray-700 pb-4">
            <h1 className="text-3xl font-bold text-red-500 uppercase">{currentWorkout?.title}</h1>
            <p className="text-gray-400">Raport postępów: {CLIENT_CONFIG.name}</p>
            <p className="text-gray-500 text-sm">Data generowania: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
            {currentWorkout?.exercises.map((ex) => {
                const data = getExerciseData(selectedWorkoutId, ex.id);
                const hasData = data && data.length > 0;
                
                if (!hasData) return null; 

                // Obliczamy domenę ręcznie
                const weights = data.map((d: any) => d.weight);
                const minVal = Math.min(...weights);
                const maxVal = Math.max(...weights);
                
                // Marginesy: dół -5 (min 0), góra +20% wartości (żeby zmieścił się napis nad kropką)
                const domainMin = Math.max(0, Math.floor(minVal - 5));
                const domainMax = Math.ceil(maxVal * 1.2); 
                const yDomain = [domainMin, domainMax];

                const maxWeight = maxVal;

                return (
                    <div key={ex.id} className="bg-[#1e1e1e] p-4 rounded-xl shadow-md border border-gray-800 break-inside-avoid">
                        <div className="flex justify-between items-end mb-4 border-b border-gray-700 pb-2">
                            <div>
                                <h3 className="font-bold text-white text-lg">{ex.name}</h3>
                                <p className="text-xs text-gray-500">{ex.pl}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-gray-400 block">Max wynik</span>
                                <span className="text-xl font-bold text-blue-400">{maxWeight} kg</span>
                            </div>
                        </div>

                        <div className="h-48 md:h-64 w-full">
                            {data.length < 2 ? (
                                <div className="h-full flex items-center justify-center text-gray-600 text-xs text-center">
                                    Za mało danych do wyrysowania linii.<br/>(Wymagane min. 2 treningi z ciężarem)
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data as any} margin={{ top: 20, right: 10, bottom: 0, left: 10 }}>
                                    <CartesianGrid stroke="#333" strokeDasharray="3 3" vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="#666" 
                                        tick={{fill: '#888', fontSize: 10}} 
                                        tickMargin={8}
                                        minTickGap={30}
                                    />
                                    {/* Ukryta oś Y, ale z ustawionym zakresem */}
                                    <YAxis 
                                        type="number"
                                        domain={yDomain}
                                        hide={true} 
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#111', border: '1px solid #444', borderRadius: '4px', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value: any) => [`${value} kg`, 'Ciężar']}
                                        labelStyle={{ color: '#aaa', marginBottom: '2px' }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="weight" 
                                        stroke="#ef4444" 
                                        strokeWidth={2} 
                                        dot={{ r: 3, fill: '#ef4444', strokeWidth: 1, stroke: '#1e1e1e' }} 
                                        activeDot={{ r: 5, fill: '#fff' }}
                                        isAnimationActive={false}
                                        label={<CustomLabel />}
                                    />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                );
            })}
            
            {currentWorkout?.exercises.every(ex => {
                 const d = getExerciseData(selectedWorkoutId, ex.id);
                 return !d || d.length === 0;
            }) && (
                <div className="col-span-full text-center py-10 text-gray-500">
                    <i className="fas fa-chart-bar text-4xl mb-4 opacity-50"></i>
                    <p>Brak danych dla wybranego planu. Uzupełnij treningi, wpisując ciężar (np. "100kg").</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}