/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Activity, Cpu, BarChart2 } from 'lucide-react';

// --- SURFACE CODE DIAGRAM ---
export const SurfaceCodeDiagram: React.FC = () => {
  const [errors, setErrors] = useState<number[]>([]);
  
  const adjacency: Record<number, number[]> = {
    0: [0, 1],
    1: [0, 2],
    2: [1, 3],
    3: [2, 3],
    4: [0, 1, 2, 3],
  };

  const toggleError = (id: number) => {
    setErrors(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const activeStabilizers = [0, 1, 2, 3].filter(stabId => {
    let errorCount = 0;
    Object.entries(adjacency).forEach(([dataId, stabs]) => {
        if (errors.includes(parseInt(dataId)) && stabs.includes(stabId)) {
            errorCount++;
        }
    });
    return errorCount % 2 !== 0;
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-72 h-72 bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-wrap justify-between content-between shadow-inner">
         {/* Grid Lines */}
         <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
            <div className="w-2/3 h-2/3 border border-slate-400"></div>
            <div className="absolute w-full h-[1px] bg-slate-400"></div>
            <div className="absolute h-full w-[1px] bg-slate-400"></div>
         </div>

         {/* Stabilizers */}
         {[
             {id: 0, x: '50%', y: '20%', type: 'Z', color: 'bg-brand-blue'},
             {id: 1, x: '20%', y: '50%', type: 'X', color: 'bg-brand-coral'},
             {id: 2, x: '80%', y: '50%', type: 'X', color: 'bg-brand-coral'},
             {id: 3, x: '50%', y: '80%', type: 'Z', color: 'bg-brand-blue'},
         ].map(stab => (
             <motion.div
                key={`stab-${stab.id}`}
                className={`absolute w-12 h-12 -ml-6 -mt-6 flex items-center justify-center text-white text-sm font-bold rounded-lg shadow-md transition-all duration-300 ${activeStabilizers.includes(stab.id) ? stab.color + ' opacity-100 scale-110 ring-4 ring-offset-2 ring-white' : 'bg-slate-200 opacity-30'}`}
                style={{ left: stab.x, top: stab.y }}
             >
                 {stab.type}
             </motion.div>
         ))}

         {/* Data Qubits */}
         {[
             {id: 0, x: '20%', y: '20%'}, {id: 1, x: '80%', y: '20%'},
             {id: 4, x: '50%', y: '50%'}, // Center
             {id: 2, x: '20%', y: '80%'}, {id: 3, x: '80%', y: '80%'},
         ].map(q => (
             <button
                key={`data-${q.id}`}
                onClick={() => toggleError(q.id)}
                className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 z-10 ${errors.includes(q.id) ? 'bg-slate-800 border-slate-900 text-brand-coral' : 'bg-white border-slate-300 hover:border-brand-coral hover:scale-110 shadow-sm'}`}
                style={{ left: q.x, top: q.y }}
             >
                {errors.includes(q.id) && <Activity size={14} />}
             </button>
         ))}
      </div>

      <div className="mt-8 flex items-center gap-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-800"></div> Error</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-brand-blue"></div> Z-Check</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-brand-coral"></div> X-Check</div>
      </div>
    </div>
  );
};

// --- TRANSFORMER DECODER DIAGRAM ---
export const TransformerDecoderDiagram: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
        setStep(s => (s + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full h-40 flex items-center justify-between gap-2 md:gap-8 p-4">
        
        {/* Input Stage */}
        <div className="flex flex-col items-center gap-3">
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 flex flex-col items-center justify-center transition-colors duration-500 shadow-lg ${step === 0 ? 'border-brand-coral bg-brand-coral/10' : 'border-slate-700 bg-slate-800'}`}>
                <div className="grid grid-cols-3 gap-1">
                    {[...Array(9)].map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${Math.random() > 0.7 ? 'bg-white' : 'bg-slate-600'}`}></div>)}
                </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Syndrome</span>
        </div>

        {/* Arrows */}
        <motion.div animate={{ opacity: step >= 1 ? 1 : 0.3, x: step >= 1 ? 0 : -5 }} className="text-slate-500 text-xl font-bold">→</motion.div>

        {/* Transformer Stage */}
        <div className="flex flex-col items-center gap-3">
             <div className={`w-24 h-24 md:w-28 md:h-28 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-colors duration-500 relative overflow-hidden shadow-lg ${step === 1 || step === 2 ? 'border-brand-purple bg-brand-purple text-white' : 'border-slate-700 bg-slate-800'}`}>
                <Cpu size={32} className={step === 1 || step === 2 ? 'text-white animate-pulse' : 'text-slate-600'} />
                {step === 1 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-[1px] bg-white absolute top-1/3 animate-ping"></div>
                        <div className="w-full h-[1px] bg-white absolute top-2/3 animate-ping delay-75"></div>
                    </div>
                )}
             </div>
             <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Transformer</span>
        </div>

        {/* Arrows */}
        <motion.div animate={{ opacity: step >= 3 ? 1 : 0.3, x: step >= 3 ? 0 : -5 }} className="text-slate-500 text-xl font-bold">→</motion.div>

        {/* Output Stage */}
        <div className="flex flex-col items-center gap-3">
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 flex flex-col items-center justify-center transition-colors duration-500 shadow-lg ${step === 3 ? 'border-green-500 bg-green-500/10' : 'border-slate-700 bg-slate-800'}`}>
                {step === 3 ? (
                    <span className="text-3xl font-bold text-green-500">X</span>
                ) : (
                    <span className="text-3xl font-bold text-slate-600">?</span>
                )}
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Correction</span>
        </div>

      </div>

      <div className="flex gap-2 mt-4">
          {[0, 1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${step === s ? 'w-12 bg-brand-purple' : 'w-3 bg-slate-700'}`}></div>
          ))}
      </div>
    </div>
  );
};

// --- PERFORMANCE CHART ---
export const PerformanceMetricDiagram: React.FC = () => {
    const [distance, setDistance] = useState<3 | 5 | 11>(5);
    
    const data = {
        3: { mwpm: 3.5, alpha: 2.9 },
        5: { mwpm: 3.6, alpha: 2.75 },
        11: { mwpm: 0.0041, alpha: 0.0009 } 
    };

    const currentData = data[distance];
    const maxVal = Math.max(currentData.mwpm, currentData.alpha) * 1.25;
    
    const formatValue = (val: number) => {
        if (val < 0.01) return val.toFixed(4) + '%';
        return val.toFixed(2) + '%';
    }

    return (
        <div className="flex flex-col md:flex-row gap-12 items-center my-8">
            <div className="flex-1 w-full">
                <div className="flex gap-3 mb-8 justify-center md:justify-start">
                    {[3, 5, 11].map((d) => (
                        <button 
                            key={d}
                            onClick={() => setDistance(d as any)} 
                            className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 border ${distance === d ? 'bg-slate-900 text-white border-slate-900 shadow-lg transform -translate-y-1' : 'bg-white text-slate-500 border-slate-200 hover:border-brand-coral hover:text-brand-coral'}`}
                        >
                            Distance {d}
                        </button>
                    ))}
                </div>
                
                <div className="relative h-64 bg-slate-50 rounded-2xl border border-slate-200 p-8 flex justify-around items-end shadow-inner">
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 p-8 flex flex-col justify-between pointer-events-none opacity-50">
                       <div className="w-full h-[1px] bg-slate-200 dashed"></div>
                       <div className="w-full h-[1px] bg-slate-200 dashed"></div>
                       <div className="w-full h-[1px] bg-slate-200 dashed"></div>
                       <div className="w-full h-[1px] bg-slate-200 dashed"></div>
                    </div>

                    {/* MWPM Bar */}
                    <div className="w-24 flex flex-col justify-end items-center h-full z-10 group">
                        <div className="flex-1 w-full flex items-end justify-center relative mb-4">
                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity w-full text-center text-sm font-bold text-slate-500 bg-white py-1 px-2 rounded-lg shadow-sm border border-slate-100">{formatValue(currentData.mwpm)}</div>
                            <motion.div 
                                className="w-full bg-slate-300 rounded-t-xl"
                                initial={{ height: 0 }}
                                animate={{ height: `${(currentData.mwpm / maxVal) * 100}%` }}
                                transition={{ type: "spring", stiffness: 80, damping: 15 }}
                            />
                        </div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Standard</div>
                    </div>

                    {/* AlphaQubit Bar */}
                    <div className="w-24 flex flex-col justify-end items-center h-full z-10 group">
                         <div className="flex-1 w-full flex items-end justify-center relative mb-4">
                            <div className="absolute -top-10 w-full text-center text-sm font-bold text-brand-coral bg-white py-1 px-2 rounded-lg shadow-md border border-brand-coral/20">{formatValue(currentData.alpha)}</div>
                            <motion.div 
                                className="w-full bg-gradient-to-t from-brand-coral to-brand-coral-dark rounded-t-xl shadow-lg relative overflow-hidden"
                                initial={{ height: 0 }}
                                animate={{ height: Math.max(1, (currentData.alpha / maxVal) * 100) + '%' }}
                                transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.1 }}
                            >
                               <div className="absolute inset-0 bg-white/20"></div>
                            </motion.div>
                        </div>
                         <div className="text-xs font-bold text-brand-coral uppercase tracking-wider">AlphaQubit</div>
                    </div>
                </div>
            </div>
        </div>
    )
}