import React, { useState } from 'react';
import { Shield, Sparkles, Activity, Anchor, Link, Heart, Eye, Briefcase, Camera, HelpCircle, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

const BlueprintAssessments = () => {
  const [activeSuite, setActiveSuite] = useState('athletic');
  const [selectedMovementRoom, setSelectedMovementRoom] = useState(null);
  const [videoLinkInput, setVideoLinkInput] = useState('');
  const [linkSaved, setLinkSaved] = useState({});

  const athleticAssessments = [
    { 
      id: "squat", 
      title: "Deep Squat & Mobility Matrix", 
      metrics: "46 Mobility Data Points", 
      duration: "4 Minutes", 
      icon: <Sparkles className="w-5 h-5 text-indigo-400" />, 
      instructions: "Stand with feet hip-width apart, arms straight out in front. Drop your hips down smoothly until thighs pass parallel to the deck surface. Hold the deep bottom position for 2 seconds before ascending. Perform 3 consecutive repetitions without rushing.",
      setup: "Position your phone camera exactly at waist height, directly 7-8 feet away from your side vector profile (lateral view). Ensure your full path from fingertips to heels remains framed within the active grid lines."
    },
    { 
      id: "land", 
      title: "Single-Leg Land & Hold Stability", 
      metrics: "Postural Sway & Kinetic Load", 
      duration: "3 Minutes", 
      icon: <Anchor className="w-5 h-5 text-emerald-400" />, 
      instructions: "Step off a standard 12-inch box or platform, dropping straight down onto a single foot. Do not jump upward. Stabilize your joints immediately upon ground impact, holding a still, crisp single-leg squat hold position for 3 full seconds without rebounding.",
      setup: "Set your camera lens directly in front of you (anterior view), 6 feet back at knee level height. Your hips, knees, and ankles must be brightly lit and visible against the floor lines to capture stability."
    },
    { id: "cmj", title: "Kinetic Power & Extension (CMJ)", metrics: "92 Neuromuscular Metrics", duration: "3 Minutes", icon: <Activity className="w-5 h-5 text-amber-400" />, instructions: "Place hands firmly on hips. Quickly descend into a half-squat brace depth and immediately explode upward into a maximal vertical jump. Extend your knees and ankles completely in mid-air. Land softly with both feet absorbing force simultaneously.", setup: "Position the mobile camera at a 45-degree front angle, 8 feet back at chest height. Keep the upper ceiling boundary clear so your head path does not get cropped out at your peak flight extension." },
    { id: "agility", title: "Multi-Plane Deceleration (Agility 505)", metrics: "43 Rotational Mechanics", duration: "3 Minutes", icon: <Shield className="w-5 h-5 text-rose-400" />, instructions: "Sprint forward at maximal speed for 5 meters up to the marked deceleration line. Plant your outside foot sharply on the boundary line, pivot 180 degrees instantaneously, and accelerate hard back through the starting point marker loop.", setup: "Mount your camera flat on a tripod 4 feet high, perpendicular to the turnaround line tracking zone. The entire lane must stay inside the view grid." }
  ];

  const wellnessAssessments = [
    { id: "neck", title: "Cervical & Desk-Posture Grid", metrics: "Neck Mobility & Spine Angles", duration: "3 Minutes", icon: <Heart className="w-5 h-5 text-cyan-400" />, instructions: "Sit upright with your spine unsupported. Look straight ahead, then tuck your chin down completely to touch your chest. Return to center, tilt your head backward to look at the ceiling, then rotate your chin smoothly to each shoulder profile.", setup: "Set the phone camera at strict eye-level alignment, 4 feet away directly from your side (profile view). Ensure a plain backdrop is behind you to cleanly index neck vertebrae rotation." },
    { id: "lunge", title: "Functional Lunge & Balance Age", metrics: "Lower Body Stability Vector", duration: "4 Minutes", icon: <Eye className="w-5 h-5 text-emerald-400" />, instructions: "Step forward cleanly into a long, controlled stride lunge. Lower your back trailing knee until it rests exactly 1 inch above the floor surface. Drive backward off your lead foot to snap directly back to an upright stance. Alternate sides smoothly.", setup: "Position camera 6 feet out from a side angle, 3 feet off the ground surface. Keep your full arm span visible to verify core bracing balances under momentum alterations." },
    { id: "trunk", title: "Trunk & Thoracic Rotation Matrix", metrics: "Spinal Twisting Decompression", duration: "3 Minutes", icon: <Briefcase className="w-5 h-5 text-amber-400" />, instructions: "Cross your arms over your chest, grabbing opposite shoulders. Sit flat on a stool to lock your pelvis in place. Twist your torso as far to the left as possible without shifting your hips. Hold for 1 second, return, and twist to the right.", setup: "Position your device camera directly overhead pointing down, or 5 feet high looking straight down onto your back lines from a rear-view trajectory to isolate torso rotation arcs." },
    { id: "grip", title: "Active Grip & Joint Elasticity", metrics: "Systemic Longevity Biomarkers", duration: "2 Minutes", icon: <Shield className="w-5 h-5 text-orange-400" />, instructions: "Extend your right arm straight in front of you at shoulder height. Squeeze your hand into a tight fist with maximal pressure force for 5 seconds. Open fingers entirely to spread wide. Repeat on the left arm line sequence.", setup: "Set camera 2 feet away directly on a tabletop desk surface focusing onto your upper chest and arm vectors. Ensure fingers stay completely framed during wide spatial extensions." }
  ];

  const activeCards = activeSuite === 'athletic' ? athleticAssessments : wellnessAssessments;

  const handleLinkSubmit = (id) => {
    if (!videoLinkInput) return;
    setLinkSaved(prev => ({ ...prev, [id]: videoLinkInput }));
    setVideoLinkInput('');
    alert("✓ FOOTAGE LINK INTEGRATED // DATA STAGED FOR COACH EVALUATION");
  };
  // =========================================================================
  // DYNAMIC SUB-PAGE: SIMPLIFIED SPLIT LAB SCANNING ROOM
  // =========================================================================
  if (selectedMovementRoom) {
    const allAssessments = [...athleticAssessments, ...wellnessAssessments];
    const movement = allAssessments.find(a => a.id === selectedMovementRoom);
    const hasSavedLink = linkSaved[movement.id];

    return (
      <div className="w-full max-w-5xl mx-auto p-4 md:p-6 bg-slate-950 border border-cyan-500/20 rounded-2xl shadow-2xl font-mono text-white animate-fade-in">
        
        {/* Sub-Header Top Title Bar Panel */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setSelectedMovementRoom(null); setVideoLinkInput(''); }}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-400 text-slate-400 hover:text-cyan-400 rounded-lg transition-all flex items-center justify-center cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[10px] text-cyan-400 font-bold block tracking-widest uppercase">// ASSESSMENT PORTAL</span>
              <h2 className="text-lg md:text-xl font-black text-slate-100 uppercase tracking-tight">{movement.title}</h2>
            </div>
          </div>
          <span className="text-xs text-indigo-400 font-black uppercase tracking-widest border border-indigo-900/40 bg-slate-950 px-3 py-1 rounded-full hidden sm:block">
            {activeSuite === 'athletic' ? 'Mobility Analysis' : 'General Wellness'}
          </span>
        </div>

        {/* Split Grid Framework Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT SIDE (Cols: 5): Link Forwarding & Vertical Graphic Blueprint Placeholders */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-5">
            
            {/* Link Entry Box */}
            <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl space-y-3">
              <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5" /> Forward Video Cloud Link
              </label>
              
              {hasSavedLink ? (
                <div className="p-3 bg-slate-950 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-400 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">STAGED: {linkSaved[movement.id]}</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={videoLinkInput}
                    onChange={(e) => setVideoLinkInput(e.target.value)}
                    placeholder="Paste iCloud, Drive, or YouTube link..."
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded p-2 text-xs outline-none text-slate-200"
                  />
                  <button 
                    onClick={() => handleLinkSubmit(movement.id)}
                    className="p-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* 3 Vertical High-Art Blueprint Vectors (Placeholders for Movement Archetypes) */}
            <div className="flex-1 grid grid-cols-3 gap-2.5 min-h-[220px]">
              {[
                { label: "01 // START POSITION", opacity: "opacity-40" },
                { label: "02 // DEPTH APEX", opacity: "opacity-60" },
                { label: "03 // UNCOIL VECTOR", opacity: "opacity-80" }
              ].map((img, i) => (
                <div key={i} className="bg-slate-900/60 border border-slate-900 rounded-xl p-3 flex flex-col justify-between items-center text-center relative overflow-hidden group shadow-inner">
                  {/* Glowing Grid Background Mock */}
                  <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-20" />
                  
                  <span className="text-[8px] text-slate-500 font-bold tracking-wider z-10">{img.label}</span>
                  
                  {/* High Art Silhouette Line Graphic Symbol */}
                  <div className={`w-12 h-16 border-b-2 border-r border-l border-cyan-500/20 rounded-b-md my-auto flex items-end justify-center pb-2 z-10 ${img.opacity}`}>
                    <div className="w-5 h-5 rounded-full border border-cyan-400/40 animate-pulse" />
                  </div>

                  <span className="text-[7px] text-cyan-500/40 font-bold z-10 tracking-widest">// BLUEPRINT_ROM</span>
                </div>
              ))}
            </div>
          </div>
          {/* RIGHT SIDE (Cols: 7): Massive Biomechanical Instructions & Angle Guidelines */}
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
            
            {/* Movement Execution Guide Card (Large Typography Font for clear readability) */}
            <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-xl space-y-3">
              <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-950 pb-2">
                <HelpCircle className="w-4 h-4" /> Movement Execution Instructions
              </div>
              <p className="text-base md:text-lg font-sans text-slate-200 leading-relaxed font-normal tracking-wide">
                {movement.instructions}
              </p>
            </div>

            {/* Tripod Set Up & Spatial Calibration Diagram Card */}
            <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-xl space-y-3 flex-1">
              <div className="text-[11px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-950 pb-2">
                <Camera className="w-4 h-4" /> Camera Angle & Telemetry Alignment
              </div>
              <p className="text-xs md:text-sm font-sans text-slate-300 leading-relaxed font-normal tracking-wide">
                {movement.setup}
              </p>
            </div>

            {/* Direct Official Submission Button Link */}
            <a 
              href="mailto:reports@://lifelongevitylab.com"
              className="w-full text-center py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.15)] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              ✉ Route Raw Video File To Coach Terminal
            </a>

          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // CORE CARDS GRID VIEWPORT WINDOW (Default View)
  // =========================================================================
  return (
    <div className="max-w-5xl mx-auto p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 backdrop-blur-md">
      <div className="mb-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-mono uppercase">
            Longevity Blueprint Assessment Suite
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-mono">
            Select an assessment pathway below to view setup grids and start your movement calibration.
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
          const current = linkSaved[item.id];
          return (
            <div 
              key={item.id} 
              onClick={() => setSelectedMovementRoom(item.id)}
              className={`p-5 rounded-xl border transition-all duration-300 relative overflow-hidden group select-none bg-slate-950/60 border-slate-800 hover:bg-slate-950 hover:border-cyan-500/30 cursor-pointer active:scale-[0.99]
                ${current ? 'border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.02)]' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">{item.icon}</div>
                <span className="text-[10px] font-mono font-semibold px-2 py-1 bg-slate-900 text-slate-400 rounded-full border border-slate-800">{item.duration}</span>
              </div>
              <h3 className="text-lg font-medium font-mono text-white group-hover:text-cyan-400 transition-colors">{item.title}</h3>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-sans">{item.desc}</p>
              
              <div className="mt-5 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">{item.metrics}</span>
                {current ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> SECURED // LINK STAGED</span>
                ) : (
                  <span className="text-cyan-400 flex items-center gap-1 font-bold group-hover:translate-x-0.5 transition-transform">Start Assessment →</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BlueprintAssessments;
