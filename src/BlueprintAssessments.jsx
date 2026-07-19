import React, { useState, useRef } from 'react';
import { Shield, Sparkles, Activity, Anchor, Upload, CheckCircle2, Loader2, Heart, Eye, Briefcase } from 'lucide-react';

const BlueprintAssessments = () => {
  const [uploadStatus, setUploadStatus] = useState({});
  const [activeSuite, setActiveSuite] = useState('athletic'); // Track active category: 'athletic' or 'wellness'
  const fileInputRefs = useRef({});

  // Performance Suite (Your Original Elite Roster Cards)
  const athleticAssessments = [
    { id: "squat", title: "Deep Squat & Mobility Matrix", metrics: "46 Mobility Data Points", duration: "4 Minutes", icon: <Sparkles className="w-5 h-5 text-indigo-400" />, desc: "Maps full-body joint angles, depth control, and structural symmetry needed for deep movement patterns." },
    { id: "land", title: "Single-Leg Land & Hold Stability", metrics: "Postural Sway & Kinetic Load", duration: "3 Minutes", icon: <Anchor className="w-5 h-5 text-emerald-400" />, desc: "Exposes hidden left-to-right imbalances and measures joint stabilization capacity under impact." },
    { id: "cmj", title: "Kinetic Power & Extension (CMJ)", metrics: "92 Neuromuscular Metrics", duration: "3 Minutes", icon: <Activity className="w-5 h-5 text-amber-400" />, desc: "Evaluates vertical power production and rate of force development to gauge nervous system vitality." },
    { id: "agility", title: "Multi-Plane Deceleration (Agility 505)", metrics: "43 Rotational Mechanics", duration: "3 Minutes", icon: <Shield className="w-5 h-5 text-rose-400" />, desc: "Analyzes breaking force, pivot control, and spatial deceleration transitions to protect hips and spine." }
  ];

  // NEW: Wellness & Corporate Matrix Suite (Inspired by Yogger.io ROM & Movement Age telemetry)
  const wellnessAssessments = [
    { id: "neck", title: "Cervical & Desk-Posture Grid", metrics: "Neck Mobility & Spine Angles", duration: "3 Minutes", icon: <Heart className="w-5 h-5 text-cyan-400" />, desc: "Evaluates forward head translation, neck rotation constraints, and shoulder rounding caused by prolonged computer use." },
    { id: "lunge", title: "Functional Lunge & Balance Age", metrics: "Lower Body Stability Vector", duration: "4 Minutes", icon: <Eye className="w-5 h-5 text-emerald-400" />, desc: "Tracks single-leg load symmetry and balance markers to calculate an objective functional 'Movement Age' score." },
    { id: "trunk", title: "Trunk & Thoracic Rotation Matrix", metrics: "Spinal Twisting Decompression", duration: "3 Minutes", icon: <Briefcase className="w-5 h-5 text-amber-400" />, desc: "Measures ribcage flexibility and rotational mobility lines to alleviate core stiffness built up during workplace shifts." },
    { id: "grip", title: "Active Grip & Joint Elasticity", metrics: "Systemic Longevity Biomarkers", duration: "2 Minutes", icon: <Shield className="w-5 h-5 text-orange-400" />, desc: "Maps nerve tracking limits and upper extremity strength markers, heavily correlated with long-term cardiovascular health profiles." }
  ];

  const handleCardClick = (id) => {
    if (fileInputRefs.current[id] && !uploadStatus[id]) {
      fileInputRefs.current[id].click();
    }
  };

  const handleFileChange = (id, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus(prev => ({ ...prev, [id]: { state: 'scanning', fileName: file.name } }));

    setTimeout(() => {
      setUploadStatus(prev => ({ ...prev, [id]: { state: 'complete', fileName: file.name } }));
    }, 4000);
  };

  const activeCards = activeSuite === 'athletic' ? athleticAssessments : wellnessAssessments;

  return (
    <div className="max-w-5xl mx-auto p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 backdrop-blur-md">
      {/* Title Header Block */}
      <div className="mb-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-mono uppercase">
            Longevity Blueprint Assessment Suite
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-mono">
            Initialize phone video pipeline streams. Once processed, diagnostic dashboards will compile.
          </p>
        </div>
      </div>

      {/* Cyberpunk Interactive Tab Selector Row */}
      <div className="flex gap-2 p-1.5 bg-slate-950/80 rounded-xl border border-slate-900 mb-6 max-w-md font-mono">
        <button
          onClick={() => setActiveSuite('athletic')}
          className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer
            ${activeSuite === 'athletic'
              ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }
          `}
        >
          ⚡ Athletic Performance
        </button>
        <button
          onClick={() => setActiveSuite('wellness')}
          className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer
            ${activeSuite === 'wellness'
              ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.25)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }
          `}
        >
          💼 Corporate Wellness (ROM)
        </button>
      </div>
      
      {/* Dynamic Grid Mapping Engine */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {activeCards.map((item) => {
          const current = uploadStatus[item.id];
          return (
            <div 
              key={item.id} 
              onClick={() => handleCardClick(item.id)}
              className={`p-5 rounded-xl border transition-all duration-300 relative overflow-hidden group select-none
                ${current?.state === 'scanning' ? 'bg-slate-950 border-cyan-500/40 cursor-wait' : ''}
                ${current?.state === 'complete' ? 'bg-slate-900/40 border-emerald-500/30 cursor-default' : 'bg-slate-950/60 border-slate-800 hover:bg-slate-950 hover:border-cyan-500/30 cursor-pointer active:scale-[0.99]'}
              `}
            >
              <input type="file" ref={el => fileInputRefs.current[item.id] = el} onChange={(e) => handleFileChange(item.id, e)} accept="video/*" className="hidden" />

              {/* Glowing High-Tech Infinity Loop Loader */}
              {current?.state === 'scanning' && (
                <div className="absolute inset-0 bg-[#020617] flex flex-col items-center justify-center p-4 z-10 font-mono text-center">
                  <div className="text-3xl text-cyan-400 font-light select-none tracking-normal animate-pulse inline-block duration-1000 transform scale-150 mb-3">
                    ∞
                  </div>
                  <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase animate-pulse">RUNNING KINETIC TELEMETRY SCAN...</p>
                </div>
              )}

              {/* Card Header Media Rings */}
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">{item.icon}</div>
                <span className="text-[10px] font-mono font-semibold px-2 py-1 bg-slate-900 text-slate-400 rounded-full border border-slate-800">{item.duration}</span>
              </div>
              <h3 className="text-lg font-medium font-mono text-white group-hover:text-cyan-400 transition-colors">{item.title}</h3>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-sans">{item.desc}</p>
              
              {/* Bottom Action Calibration Strip */}
              <div className="mt-5 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">{item.metrics}</span>
                {!current && <span className="text-cyan-400 flex items-center gap-1 font-bold group-hover:translate-x-0.5 transition-transform"><Upload className="w-3 h-3" /> Initialize Scanner →</span>}
                {current?.state === 'complete' && <span className="text-emerald-400 flex items-center gap-1 font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> PIPELINE SECURED // PENDING COACH CODE</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BlueprintAssessments;
