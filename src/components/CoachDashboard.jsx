import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import {
  User,
  Mail,
  Phone,
  Calendar,
  ClipboardList,
  FileText,
  CheckSquare,
  Upload,
} from 'lucide-react';
import { CustomHologramMesh } from './CenterSphere';
import { AssessmentMorphScene } from './AssessmentMorphScene';

export default function CoachDashboard({
  viewState,
  renderSystemHeader,
  handleReturnToCore,
  activeClientProfile,
  accessCode,
  isCoachMode,
  isEditMode,
  setIsEditMode,
  editNotes,
  setEditNotes,
  editDesc,
  setEditDesc,
  editMetrics,
  setEditMetrics,
  editBirthdate,
  setEditBirthdate,
  editEmail,
  setEditEmail,
  editPhone,
  setEditPhone,
  editTier,
  setEditTier,
  editJoinedDate,
  setEditJoinedDate,
  editReportUrl,
  setEditReportUrl,
  editAssessmentPhoto,
  setEditAssessmentPhoto,
  activeFocusField,
  setActiveFocusField,
  handleSaveProfileChanges,
  handleChangeClientCode,
  handleDeleteClientRecord,
  localDatabase,
  handleSelectClientFromMenu,
  handleDeleteClientFromRoster,
  newClientName,
  setNewClientName,
  newClientCode,
  setNewClientCode,
  newClientArchetype,
  setNewClientArchetype,
  handleCreateNewClient,
  selectedAnalysis,
  bootProgress,
  clientList,
  currentIdx,
  displayClientName,
}) {
  // SYSTEM FRAME B: Premium Biometric Client Profile Portal Hub
  if (viewState === 'client_profile' && activeClientProfile) {
    return (
      <div className="w-full h-full bg-[#020617]/95 text-white font-mono flex flex-col overflow-hidden relative backdrop-blur-xl">
        {renderSystemHeader(`CLIENT_DOSSIER // ${activeClientProfile.name.toUpperCase()}`)}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center">
          {/* Your main active card panel framework remains perfectly safe inside here */}
          <div className="w-full max-w-7xl bg-slate-950/90 border border-cyan-500/20 rounded-2xl backdrop-blur-xl p-6 md:p-8 shadow-2xl relative">

            {/* Dossier Header Info Block */}
            <div className="border-b border-slate-900 pb-4 mb-6">
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-0.5">// ACTIVE PROFILE ARCHIVE</div>
              <h2 className="text-2xl font-black text-slate-100 tracking-tight uppercase">{activeClientProfile.name}</h2>
            </div>

            {/* Grid Separation Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Demographics, Core Identity & Tier Modifiers */}
              <div className="space-y-4">
                <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-xl flex flex-col items-center text-center">
                  <h3 className="font-mono text-xl font-bold text-white tracking-widest uppercase mb-1">
                    {activeClientProfile.name}
                  </h3>

                  <p className="font-mono text-sm font-black text-cyan-400 tracking-wider uppercase animate-[pulse_4s_ease-in-out_infinite] drop-shadow-[0_0_8px_rgba(34,211,238,0.2)] mb-4">
                    // ACTIVE PROFILE ARCHIVE //
                  </p>

                  <div className="mb-4 text-xs font-bold text-cyan-400 uppercase tracking-widest px-2.5 py-0.5 bg-slate-950 rounded-full border border-slate-800">
                    {activeClientProfile.archetype}
                  </div>

                  <div className="w-full border-t border-slate-900/60 pt-3 text-center">
                    <span className="text-[9px] text-slate-600 block uppercase font-bold tracking-wider mb-1">CURRENT MATRIX SUBSCRIPTION</span>
                    {isEditMode ? (
                      <select
                        value={editTier}
                        onChange={(e) => setEditTier(e.target.value)}
                        className="bg-slate-950 border border-cyan-500/40 focus:border-cyan-400 text-cyan-400 font-mono text-xs rounded px-2 py-1.5 outline-none tracking-wide text-center cursor-pointer transition-colors max-w-full font-bold uppercase shadow-inner"
                      >
                        <option value="Vector Tier">Vector Tier</option>
                        <option value="Tensegrity Tier">Tensegrity Tier</option>
                        <option value="Infinite Matrix Tier">Infinite Matrix Tier</option>
                      </select>
                    ) : (
                      <span className={`text-sm font-black tracking-wide uppercase font-mono block mt-0.5
                        ${activeClientProfile.matrixTier === 'Infinite Matrix Tier' ? 'text-amber-400' : ''}
                        ${activeClientProfile.matrixTier === 'Tensegrity Tier' ? 'text-cyan-400' : ''}
                        ${activeClientProfile.matrixTier === 'Vector Tier' ? 'text-indigo-400' : ''}
                      `}>
                        {activeClientProfile.matrixTier || "Vector Tier"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Secure Digital Contact Cards with Form Field Inputs */}
                <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4 text-xs font-medium text-slate-300">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-950 pb-1.5">
                    // IDENTITY SPECIFICATIONS
                  </div>

                  {/* Date of Birth Field Row */}
                  <div className="space-y-1 font-mono">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />{' '}
                      <span className="text-[9px] font-bold tracking-wider uppercase">Date of Birth</span>
                    </div>
                    {isEditMode && isCoachMode ? (
                      <input
                        type="text"
                        value={editBirthdate}
                        onChange={(e) => setEditBirthdate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-sm outline-none font-sans"
                        placeholder="MM/DD/YYYY"
                      />
                    ) : (
                      <div className="text-sm font-semibold text-slate-200 pl-5">{activeClientProfile.birthdate}</div>
                    )}
                  </div>

                  {/* Email Contact Field Row */}
                  <div className="space-y-1 font-mono">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="w-3.5 h-3.5" />{' '}
                      <span className="text-[9px] font-bold tracking-wider uppercase">Email Contact</span>
                    </div>
                    {isEditMode && isCoachMode ? (
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-sm outline-none font-sans truncate"
                        placeholder="name@email.com"
                      />
                    ) : (
                      <div className="text-sm font-semibold text-slate-200 pl-5 truncate max-w-full font-sans">
                        {activeClientProfile.email}
                      </div>
                    )}
                  </div>

                  {/* Phone Contact Field Row */}
                  <div className="space-y-1 font-mono">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone className="w-3.5 h-3.5" />{' '}
                      <span className="text-[9px] font-bold tracking-wider uppercase">Phone Terminal</span>
                    </div>
                    {isEditMode && isCoachMode ? (
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-sm outline-none font-sans"
                        placeholder="(555) 000-0000"
                      />
                    ) : (
                      <div className="text-sm font-semibold text-slate-200 pl-5">{activeClientProfile.phone}</div>
                    )}
                  </div>

                  {/* NEW: Live Enrollment Date Modifier Field */}
                  <div className="space-y-1 font-mono">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />{' '}
                      <span className="text-[9px] font-bold tracking-wider uppercase">Enrollment Date</span>
                    </div>
                    {isEditMode && isCoachMode ? (
                      <input
                        type="text"
                        value={editJoinedDate}
                        onChange={(e) => setEditJoinedDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-slate-200 text-sm outline-none font-sans"
                        placeholder="MM/DD/YYYY"
                      />
                    ) : (
                      <div className="text-sm font-semibold text-slate-200 pl-5">
                        {activeClientProfile.joinedDate || 'PENDING INITIAL SESSION'}
                      </div>
                    )}
                  </div>

                  {/* Coach-only: raw report URL admin control */}
                  {isCoachMode && (
                    <div className="space-y-1 font-mono">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />{' '}
                        <span className="text-[9px] font-bold tracking-wider uppercase text-cyan-400">
                          Google Drive Report URL
                        </span>
                      </div>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editReportUrl}
                          onChange={(e) => setEditReportUrl(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-cyan-400 text-xs outline-none font-sans shadow-inner"
                          placeholder="Paste Google Drive share link here..."
                        />
                      ) : (
                        <div className="text-xs text-slate-400 font-sans pl-5 truncate max-w-full italic">
                          {activeClientProfile.reportUrl && activeClientProfile.reportUrl !== ''
                            ? activeClientProfile.reportUrl
                            : 'No link connected // Compiling state'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Coach-only: biometric photo URL admin control */}
                  {isCoachMode && (
                    <div className="space-y-1 font-mono">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Upload className="w-3.5 h-3.5 text-cyan-500" />{' '}
                        <span className="text-[9px] font-bold tracking-wider uppercase text-cyan-400">
                          🧬 [ UPDATE CORE BIOMETRIC PHOTO URL ]
                        </span>
                      </div>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editAssessmentPhoto}
                          onChange={(e) => setEditAssessmentPhoto(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded p-1.5 text-cyan-400 text-xs outline-none font-sans shadow-inner"
                          placeholder="Paste assessment photo URL or /public path..."
                        />
                      ) : (
                        <div className="text-xs text-slate-400 font-sans pl-5 truncate max-w-full italic">
                          {activeClientProfile.assessmentPhoto
                            ? activeClientProfile.assessmentPhoto
                            : 'No biometric photo linked // 3D hologram active'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Embedded Access PIN Passcode Row */}
                  <div className="pt-3 border-t border-slate-900/60 flex items-center justify-between text-slate-400 font-mono">
                    <span className="font-bold text-[10px] tracking-wider text-slate-500 uppercase">SYS_ACCESS_PIN:</span>
                    <span className="text-sm font-black text-cyan-400 tracking-widest bg-slate-950 px-2 py-0.5 border border-slate-900 rounded">
                      {accessCode}
                    </span>
                  </div>
                </div>
              </div>
              {/* Middle Column: Architectural Movement Notes, Case Logs & Focus Writing Pads */}
              <div className="space-y-4 flex flex-col justify-start">
                {/* Movement Vector Log Card / Text Area Trigger */}
                <div
                  onClick={() => isEditMode && setActiveFocusField('desc')}
                  className={`p-5 bg-slate-900/40 border border-slate-900 rounded-xl transition-all duration-200
                    ${isEditMode ? 'hover:bg-slate-900 hover:border-cyan-500/50 cursor-zoom-in group shadow-lg shadow-cyan-950/20' : ''}
                  `}
                >
                  <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-widest flex items-center justify-between mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Biomechanical Archetype Vector
                    </span>
                    {isEditMode && (
                      <span className="text-[9px] text-cyan-500 font-black animate-pulse tracking-wider bg-slate-950 px-2 py-0.5 border border-slate-800 rounded">
                        ⛶ CLICK TO EXPAND
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-sans text-slate-200 leading-relaxed font-normal tracking-wide whitespace-pre-wrap line-clamp-6">
                    {isEditMode ? editDesc || 'No narrative logged yet.' : activeClientProfile.desc}
                  </p>
                </div>

                {/* Coach Strategic Directive Log Card / Text Area Trigger */}
                <div
                  onClick={() => isEditMode && setActiveFocusField('notes')}
                  className={`p-5 bg-slate-900/40 border border-slate-900 rounded-xl transition-all duration-200
                    ${isEditMode ? 'hover:bg-slate-900 hover:border-indigo-500/50 cursor-zoom-in group shadow-lg shadow-indigo-950/20' : ''}
                  `}
                >
                  <div className="text-[11px] text-indigo-400 font-bold uppercase tracking-widest flex items-center justify-between mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4" /> Kinetic Directives & Case Log
                    </span>
                    {isEditMode && (
                      <span className="text-[9px] text-indigo-500 font-black animate-pulse tracking-wider bg-slate-950 px-2 py-0.5 border border-slate-800 rounded">
                        ⛶ CLICK TO EXPAND
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-sans text-slate-200 leading-relaxed font-normal tracking-wide whitespace-pre-wrap line-clamp-6">
                    {isEditMode ? editNotes || 'No directives logged yet.' : activeClientProfile.notes}
                  </p>
                </div>
              </div>

              {/* Right Column: High-Art Studio 3D Preview Deck */}
              <div className="flex flex-col justify-between items-center h-full min-h-[460px] relative">
                <div className="w-full h-full bg-slate-950/70 border border-cyan-500/20 rounded-xl p-4 backdrop-blur-xl flex flex-col shadow-2xl animate-fade-in">
                  <div className="flex justify-between items-center mb-3 border-b border-slate-900 pb-2.5">
                    <div>
                      <p className="text-[10px] tracking-widest text-cyan-400 font-mono uppercase">// TENSEGRITY LAYER</p>
                      <h3 className="text-sm font-bold tracking-wider text-slate-200 uppercase">CORE VECTOR DECK</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono block text-slate-500 uppercase tracking-widest">ACTIVE ARCHIVE</span>
                      <span className="text-xs font-mono text-cyan-400 font-bold">
                        {activeClientProfile.name.split(' ')[0].toUpperCase()}_SYS
                      </span>
                    </div>
                  </div>

                  {/* Core Vector Deck — assessment photo overlay OR 3D hologram fallback */}
                  <div
                    data-rodin-biometric-slot="standing-back"
                    className="flex-1 w-full bg-[#030d1e]/40 border border-cyan-950/60 rounded-lg overflow-hidden relative inner-shadow min-h-[300px] flex flex-col"
                  >
                    <div className="absolute top-2 left-2 z-10 pointer-events-none">
                      <span className="text-[8px] font-mono font-bold tracking-[0.18em] uppercase text-slate-600 bg-slate-950/70 border border-slate-800/80 px-2 py-0.5 rounded">
                        {activeClientProfile.assessmentPhoto
                          ? '// ASSESSMENT PHOTO // BIOMETRIC OVERLAY'
                          : '// RODIN BIOMETRIC SLOT // STANDING BACK'}
                      </span>
                    </div>
                    <div className="relative flex-1 w-full min-h-[300px] flex items-center justify-center p-3 overflow-hidden">
                      {activeClientProfile.assessmentPhoto ? (
                        <div className="relative overflow-hidden w-full h-full rounded-xl">
                          <img
                            src={activeClientProfile.assessmentPhoto}
                            alt={`${activeClientProfile.name} assessment biometric`}
                            className="w-full h-full object-contain rounded-xl opacity-90 brightness-110 drop-shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          />
                          <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-[scan_3s_ease-in-out_infinite] pointer-events-none" />
                        </div>
                      ) : (
                        <Canvas camera={{ position: [0, 0.9, 7.5], fov: 42 }} className="w-full h-full">
                          <ambientLight intensity={2.5} />
                          <Suspense fallback={null}>
                            <CustomHologramMesh viewState="client_profile" />
                          </Suspense>
                          <OrbitControls enablePan={false} enableZoom={true} minDistance={3} maxDistance={10} />
                        </Canvas>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Dossier Actions Terminal */}
            <div className="pt-5 border-t border-slate-900 mt-5 flex flex-wrap justify-end items-center gap-3">
              {isCoachMode ? (
                <div className="flex flex-wrap gap-2 animate-fade-in">
                  <button
                    onClick={() => {
                      const reportText = `==================================================\nLONGEVITY BLUEPRINT OBJECTIVE BIOMETRIC REPORT\n==================================================\nATHLETE DOSSIER: ${activeClientProfile.name.toUpperCase()}\nARCHETYPE:       ${activeClientProfile.archetype.toUpperCase()}\nPASSCODE KEY:    [ ${accessCode} ]\nRECORDED DOB:    ${activeClientProfile.birthdate}\nCONTACT LINE:    ${activeClientProfile.email}\n--------------------------------------------------\n BIOMECHANICAL ARCHETYPE VECTOR LOG:\n${editDesc}\n KINETIC DIRECTIVES & CASE COACH NOTES:\n${editNotes}\n-------------------------------------------------- VERIFIED METRIC CALIBRATION RATINGS:\n- Deep Squat Mobility Matrix:    ${editMetrics.squat}\n- Single-Leg Land Stability:     ${editMetrics.land}\n- Kinetic Power Extension (CMJ): ${editMetrics.cmj}\n- Multi-Plane Deceleration (505): ${editMetrics.agility}\n==================================================\nSECURE BLUEPRINT GENERATION // SYSTEMS ENGINE v4.8\n==================================================`;
                      const element = document.createElement('a');
                      const file = new Blob([reportText], { type: 'text/plain' });
                      element.href = URL.createObjectURL(file);
                      element.download = `${activeClientProfile.name.replace(/\s+/g, '_')}_Biometric_Blueprint.txt`;
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    className="px-3 py-1.5 bg-slate-950 text-cyan-400 border border-cyan-500/40 hover:border-cyan-400 rounded font-mono font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer"
                  >
                    📥 Export Data
                  </button>
                  <button
                    onClick={handleChangeClientCode}
                    className="px-3 py-1.5 bg-slate-950 text-indigo-400 border border-indigo-500/40 hover:border-indigo-400 rounded font-mono font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer"
                  >
                    🔑 Change Code
                  </button>
                  <button
                    onClick={() => (isEditMode ? handleSaveProfileChanges() : setIsEditMode(true))}
                    className={`px-3 py-1.5 rounded font-mono font-bold text-[10px] uppercase transition-all cursor-pointer border ${
                      isEditMode
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-950 text-cyan-400 border-cyan-500/40'
                    }`}
                  >
                    {isEditMode ? '✓ Save Changes' : '⚙ Modify Record'}
                  </button>
                  <button
                    onClick={handleDeleteClientRecord}
                    className="px-3 py-1.5 bg-slate-950/40 text-rose-500 border border-rose-900/50 hover:border-rose-500 rounded font-mono font-bold text-[10px] uppercase transition-all cursor-pointer"
                  >
                    🗑️ Delete Client
                  </button>
                </div>
              ) : (
                /* Client View: Launches their custom secure cloud folder on click */
                <div className="flex flex-wrap items-center gap-3 font-mono animate-fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      // Pull the shared folder path string directly from memory
                      const destinationUrl = activeClientProfile.reportUrl;

                      if (destinationUrl && destinationUrl !== '') {
                        // Launches their Dropbox/Drive folder in a clean separate window tab
                        window.open(destinationUrl, '_blank', 'noopener,noreferrer');
                      } else {
                        // Fallback warning if you haven't assigned a cloud path yet
                        alert(
                          '⚡ TELEMETRY COMPILING // COACH IS REFINING YOUR OBJECTIVE BIOMECHANICAL REPORT. REGISTRATION LINK COMING SOON.'
                        );
                      }
                    }}
                    className="px-4 py-1.5 bg-slate-950 hover:bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 font-bold rounded text-[10px] tracking-widest uppercase transition-all cursor-pointer active:scale-95 shadow-md flex items-center gap-1.5"
                  >
                    📥 Download Report
                  </button>
                  <div className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase bg-slate-950 px-3 py-1.5 border border-emerald-900/40 rounded shadow-md">
                    ✓ SECURE CLIENT READ-ONLY PATHWAY ENFORCED
                  </div>
                </div>
              )}
            </div>

            {/* High-Art Secure Document Status Footer Bar */}
            <div className="mt-6 pt-4 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 gap-2 font-mono">
              <div className="flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>OFFICIAL BIOMETRIC BLUEPRINT SECURED // VALID ACCESS PATH</span>
              </div>
              <div>STATION RECOVERY ENGINE: v4.8_STABLE</div>
            </div>

          </div>
        </div>

        {/* Dynamic Focus Pad Overlay Area Component */}
        {activeFocusField && (
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8 animate-fade-in font-mono">
            <div
              className={`w-full max-w-5xl h-[90vh] bg-slate-950 border rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-2xl transition-all duration-300 ${
                activeFocusField === 'desc' ? 'border-cyan-500/40' : 'border-indigo-500/40'
              }`}
            >
              <div>
                <div className="flex justify-between items-center border-b border-slate-900 pb-4 mb-5">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">// HIGH-CAPACITY TEXT FOCUS WRITER</span>
                    <h3
                      className={`text-lg font-black uppercase mt-0.5 ${
                        activeFocusField === 'desc' ? 'text-cyan-400' : 'text-indigo-400'
                      }`}
                    >
                      {activeFocusField === 'desc'
                        ? 'Biomechanical Archetype Editor'
                        : 'Kinetic Directives Case Logger'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveFocusField(null)}
                    className="px-3.5 py-1.5 border border-slate-800 hover:border-slate-600 rounded-lg text-slate-400 text-xs bg-slate-900 font-bold tracking-widest uppercase cursor-pointer active:scale-95"
                  >
                    ✕ Close Pad [ESC]
                  </button>
                </div>
                <textarea
                  autoFocus
                  readOnly={!isCoachMode}
                  value={activeFocusField === 'desc' ? editDesc : editNotes}
                  onChange={(e) =>
                    isCoachMode &&
                    (activeFocusField === 'desc' ? setEditDesc(e.target.value) : setEditNotes(e.target.value))
                  }
                  className={`w-full h-[62vh] bg-[#030712] border border-slate-900 rounded-xl p-6 text-base text-slate-200 font-sans focus:outline-none resize-none ${
                    activeFocusField === 'desc' ? 'focus:border-cyan-500/60' : 'focus:border-indigo-500/60'
                  }`}
                />
              </div>
              <div className="border-t border-slate-900 pt-4 flex justify-between items-center">
                <div className="text-[11px] text-slate-600">MATRIX CELL: {activeFocusField.toUpperCase()}_LOG_BUFFER</div>
                <button
                  onClick={() => setActiveFocusField(null)}
                  className={`px-5 py-2.5 rounded-lg text-slate-950 font-bold text-xs tracking-widest uppercase cursor-pointer active:scale-95 ${
                    activeFocusField === 'desc' ? 'bg-cyan-400' : 'bg-indigo-400'
                  }`}
                >
                  ✓ Close & Minimize
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // SYSTEM FRAME C: Master Coach Roster & Onboarding Console Menu
  if (viewState === 'coach_menu') {
    return (
      <div className="w-full h-full bg-[#01040a]/95 text-white font-mono flex flex-col overflow-hidden select-none backdrop-blur-xl">
        {renderSystemHeader('COACH_TERMINAL')}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center">
          <div className="w-full max-w-5xl bg-slate-950/90 border border-cyan-500/20 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 relative backdrop-blur-xl">
          {/* Master Control Board Title Section */}
          <div className="pb-2">
            <span className="text-[10px] text-cyan-400 font-bold block tracking-widest uppercase">
              // CONTROL TERMINAL ARCHIVES
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight uppercase">
              Coach Intelligence Dashboard
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column: Onboard a New Client Form (Large Text Inputs) */}
            <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4">
              <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-widest border-b border-slate-950 pb-2 flex items-center gap-1.5">
                <User className="w-4 h-4" /> Onboard New Athlete Matrix
              </div>
              <form onSubmit={handleCreateNewClient} className="space-y-4 font-mono text-sm">
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded p-2.5 text-slate-200 outline-none font-sans text-base transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                    Assign 4-Digit Passcode
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newClientCode}
                    onChange={(e) => setNewClientCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 4444"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded p-2.5 text-slate-400 focus:text-cyan-400 tracking-[0.25em] text-center font-black text-lg outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                    Movement Specialization Archetype
                  </label>
                  <select
                    value={newClientArchetype}
                    onChange={(e) => setNewClientArchetype(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded p-2.5 text-slate-200 outline-none text-xs tracking-wider transition-colors cursor-pointer"
                  >
                    <option value="Acrobatics & Hand Balance">Acrobatics & Hand Balance</option>
                    <option value="Jiu-Jitsu / Combat Athlete">Jiu-Jitsu / Combat Athlete</option>
                    <option value="Advanced Yoga Practitioner">Advanced Yoga Practitioner</option>
                    <option value="MMA / Muay Thai Striking">MMA / Muay Thai Striking</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full text-center py-2.5 bg-cyan-500 text-slate-950 font-bold border border-cyan-400 rounded-lg text-xs uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.25)] active:scale-[0.98] mt-2"
                >
                  ➕ Initialize Client Portal
                </button>
              </form>
            </div>

            {/* Right Column: Master Active Client List Matrix Roster */}
            <div className="lg:col-span-2 p-5 bg-slate-900/40 border border-slate-900 rounded-xl space-y-4">
              <div className="text-[11px] text-indigo-400 font-bold uppercase tracking-widest border-b border-slate-950 pb-2">
                // SECURE SYSTEM DATABASE ARCHIVES
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {Object.entries(localDatabase).map(([code, client]) => (
                  <div
                    key={code}
                    onClick={() => handleSelectClientFromMenu(code)}
                    className="p-4 bg-slate-950 hover:bg-slate-900 border border-slate-900 hover:border-cyan-500/30 rounded-xl transition-all flex items-center justify-between cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-base font-bold text-slate-200 group-hover:text-cyan-400 transition-colors truncate">
                          {client.name}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase font-medium tracking-wide mt-0.5 truncate">
                          {client.archetype}
                        </div>
                      </div>
                    </div>

                    {/* New Matrix Tier, Enrolled Date & Private Deletion Controls */}
                    <div className="flex items-center gap-6 text-right font-mono shrink-0 ml-4">
                      <div className="hidden sm:block">
                        <span className="text-[9px] text-slate-600 block uppercase font-bold tracking-wider">ENROLLED</span>
                        <span className="text-xs text-slate-400 font-medium">{client.joinedDate || 'PENDING'}</span>
                      </div>

                      <div className="min-w-[120px]">
                        <span className="text-[9px] text-slate-600 block uppercase font-bold tracking-wider">MATRIX LEVEL</span>
                        <span
                          className={`text-xs font-black tracking-wide uppercase
                          ${client.matrixTier === 'Infinite Matrix Tier' ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.25)]' : ''}
                          ${client.matrixTier === 'Tensegrity Tier' ? 'text-cyan-400' : ''}
                          ${client.matrixTier === 'Vector Tier' ? 'text-indigo-400' : ''}
                        `}
                        >
                          {client.matrixTier || 'Vector Tier'}
                        </span>
                      </div>

                      {/* Private Coach Destructive Scrub Trigger (Bypasses clicking row portal) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `CRITICAL SYSTEM WARNING // PERMANENTLY SCRUB ${client.name.toUpperCase()} FROM LOG ARCHIVES?\n\nTHIS OPERATION CANNOT BE UNDONE.`
                            )
                          ) {
                            handleDeleteClientFromRoster(code);
                          }
                        }}
                        className="p-2 bg-slate-900/60 border border-slate-900 hover:border-rose-900 text-slate-600 hover:text-rose-500 rounded-lg transition-all cursor-pointer active:scale-90 font-sans text-xs font-bold"
                        title="Scrub Client Record"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // SYSTEM FRAME B: Telemetry Sync Calibration Bar Loader
  if (viewState === 'loading') {
    return (
      <div className="w-full h-full bg-[#02050d]/90 text-white flex flex-col items-center justify-center font-mono p-6 select-none relative overflow-hidden backdrop-blur-md">
        <div className="w-[440px] bg-slate-950/90 border border-cyan-500/20 p-8 rounded-xl shadow-[0_0_60px_rgba(6,182,212,0.05)] backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6 border-b border-cyan-950/60 pb-4">
            <span className="text-[12px] tracking-widest text-cyan-400 uppercase font-bold">SYSTEM CALIBRATION</span>
            <span className="text-[10px] text-slate-500 font-bold">LN_V4.8</span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm tracking-wider text-slate-300 mb-2">
                <span className="uppercase">COMPILING {selectedAnalysis}...</span>
                <span className="text-cyan-400 font-bold">{Math.min(bootProgress, 100)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-900 border border-cyan-950 rounded-full overflow-hidden p-[2px]">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full transition-all duration-100 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                  style={{ width: `${Math.min(bootProgress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SYSTEM FRAME C: High-Art Studio Preview Deck View
  if (viewState === 'dashboard') {
    return (
      <div className="w-full h-full bg-[#020813]/95 text-white flex flex-col font-sans select-none overflow-hidden backdrop-blur-xl">
        {renderSystemHeader('ASSESSMENT_DECK')}

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
            {/* Upgraded Larger Viewport Container Card */}
            <div className="w-[640px] h-[680px] bg-slate-950/90 border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-xl flex flex-col shadow-2xl transition-all duration-300">
              <div className="flex justify-between items-center mb-4 border-b border-slate-900 pb-3">
                <div>
                  <p className="text-[11px] tracking-widest text-cyan-400 font-mono uppercase">Biomechanical Target</p>
                  <h2 className="text-lg font-bold tracking-wider text-slate-200 uppercase">{selectedAnalysis}</h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono block text-slate-500 uppercase tracking-widest">Active Matrix</span>
                  <span className="text-[12px] font-mono text-cyan-400 font-bold">{displayClientName}</span>
                </div>
              </div>

              <div className="flex-1 w-full bg-[#030d1e]/90 border border-cyan-950/60 rounded-xl overflow-hidden relative inner-shadow">
                <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }}>
                  <ambientLight intensity={1.5} />
                  <directionalLight position={[10, 10, 5]} intensity={1} />
                  <Suspense fallback={null}>
                    <AssessmentMorphScene clientImagePath={clientList[currentIdx]} />
                  </Suspense>
                  <Grid
                    renderOrder={-1}
                    position={[0, -1.35, 0]}
                    args={[10.5, 10.5]}
                    cellSize={0.25}
                    cellThickness={0.7}
                    cellColor="#082f49"
                    sectionSize={1.25}
                    sectionThickness={1.2}
                    sectionColor="#0e7490"
                    fadeDistance={6}
                  />
                  <OrbitControls enableZoom maxPolarAngle={Math.PI / 2 + 0.1} minPolarAngle={Math.PI / 4} />
                </Canvas>
              </div>

              <div className="mt-4 flex flex-col gap-2 pointer-events-auto">
                <div className="flex gap-2 w-full pointer-events-auto">
                  <a href="/report.pdf" target="_blank" rel="noopener noreferrer" className="flex-1">
                    <button
                      type="button"
                      className="w-full px-3 py-2 bg-slate-900 border border-cyan-400/60 text-cyan-300 text-[12px] font-mono font-bold tracking-wider rounded-lg uppercase shadow-[0_0_12px_rgba(0,242,254,0.35)] transition-all duration-200 hover:border-cyan-300 hover:text-cyan-100 hover:bg-cyan-950/60 hover:shadow-[0_0_22px_rgba(0,242,254,0.65)] hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Open Report
                    </button>
                  </a>
                  <button
                    onClick={handleReturnToCore}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-cyan-950 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 text-[12px] font-mono font-bold tracking-wider rounded-lg uppercase"
                  >
                    ↩ Return To Core
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return null;
}
