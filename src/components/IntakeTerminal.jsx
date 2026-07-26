import React, { useEffect, useRef, useState } from 'react';

const ARCHIVE_EMAIL_TARGET = import.meta.env.VITE_APP_EMAIL_TARGET;

const CONTACT_HOURS = ['Morning', 'Afternoon', 'Evening'];
const CONTACT_PREFERENCES = [
  { id: 'text', label: 'PREFER TEXT' },
  { id: 'call', label: 'PREFER CALL' },
];

const INTAKE_LS_KEYS = {
  name: 'intake_client_name',
  email: 'intake_email',
  phone: 'intake_phone',
  contactPreference: 'intake_contact_preference',
  requestedDate: 'intake_requested_date',
  contactHours: 'intake_contact_hours',
  goalsNote: 'intake_background_notes',
};

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  contactPreference: '',
  requestedDate: '',
  contactHours: [],
  goalsNote: '',
};

const readIntakeDraft = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return { ...EMPTY_FORM };
    let contactHours = [];
    try {
      const rawHours = localStorage.getItem(INTAKE_LS_KEYS.contactHours);
      const parsed = rawHours ? JSON.parse(rawHours) : [];
      contactHours = Array.isArray(parsed) ? parsed : [];
    } catch {
      contactHours = [];
    }
    return {
      name: localStorage.getItem(INTAKE_LS_KEYS.name) || '',
      email: localStorage.getItem(INTAKE_LS_KEYS.email) || '',
      phone: localStorage.getItem(INTAKE_LS_KEYS.phone) || '',
      contactPreference: localStorage.getItem(INTAKE_LS_KEYS.contactPreference) || '',
      requestedDate: localStorage.getItem(INTAKE_LS_KEYS.requestedDate) || '',
      contactHours,
      goalsNote: localStorage.getItem(INTAKE_LS_KEYS.goalsNote) || '',
    };
  } catch {
    return { ...EMPTY_FORM };
  }
};

const clearIntakePersistence = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    Object.values(INTAKE_LS_KEYS).forEach((key) => localStorage.removeItem(key));
  } catch {
    /* storage may be blocked */
  }
};

/**
 * Full-screen laboratory Intake Onboarding Terminal — non-virtual package tiers.
 */
export default function IntakeTerminal({ onTransmitComplete }) {
  const [form, setForm] = useState(() => readIntakeDraft());
  const [errors, setErrors] = useState({});
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [networkError, setNetworkError] = useState('');
  const skipNextPersistRef = useRef(true);

  // Sync draft fields to localStorage whenever the user types / toggles
  useEffect(() => {
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.setItem(INTAKE_LS_KEYS.name, form.name);
      localStorage.setItem(INTAKE_LS_KEYS.email, form.email);
      localStorage.setItem(INTAKE_LS_KEYS.phone, form.phone);
      localStorage.setItem(INTAKE_LS_KEYS.contactPreference, form.contactPreference);
      localStorage.setItem(INTAKE_LS_KEYS.requestedDate, form.requestedDate);
      localStorage.setItem(INTAKE_LS_KEYS.contactHours, JSON.stringify(form.contactHours));
      localStorage.setItem(INTAKE_LS_KEYS.goalsNote, form.goalsNote);
    } catch {
      /* storage may be blocked */
    }
  }, [form]);

  const toggleHour = (hour) => {
    setForm((prev) => {
      const hasHour = prev.contactHours.includes(hour);
      return {
        ...prev,
        contactHours: hasHour
          ? prev.contactHours.filter((h) => h !== hour)
          : [...prev.contactHours, hour],
      };
    });
  };

  const validate = () => {
    const next = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const validEmail = email.length > 0 && email.includes('@');
    const validPhone = phone.length > 0;

    // Mandatory identity
    if (!name) {
      next.name = 'IDENTITY SIGNATURE REQUIRED';
    }

    // Flexible pipeline — need at least one valid contact channel
    if (!validEmail && !validPhone) {
      next.contact = 'PROVIDE EMAIL OR PHONE PIPELINE';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleTransmit = async (e) => {
    e.preventDefault();
    if (isTransmitting || showThankYou) return;

    if (!validate()) {
      // Block success overlay — keep form visible with field + form-level errors
      return;
    }

    setErrors({});
    setNetworkError('');
    setIsTransmitting(true);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      contactPreference: form.contactPreference,
      requestedDate: form.requestedDate.trim(),
      contactHours: [...form.contactHours],
      goalsNote: form.goalsNote.trim(),
      transmittedAt: new Date().toISOString(),
    };

    try {
      const endpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT_ID;
      if (!endpoint) {
        setIsTransmitting(false);
        setNetworkError('[ ERROR // FORMSPREE ENDPOINT NOT CONFIGURED ]');
        return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          preference: payload.contactPreference,
          targetDate: payload.requestedDate,
          contactHours: payload.contactHours,
          backgroundNotes: payload.goalsNote,
        }),
      });

      if (response.ok) {
        // Clear draft keys so the next session starts clean
        clearIntakePersistence();
        setForm({ ...EMPTY_FORM });
        skipNextPersistRef.current = true;

        // Brief pulse, then thank-you overlay + exit loop
        setTimeout(() => {
          setIsTransmitting(false);
          setShowThankYou(true);
          setTimeout(() => {
            if (typeof onTransmitComplete === 'function') onTransmitComplete(payload);
          }, 2800);
        }, 900);
      } else {
        setIsTransmitting(false);
        setNetworkError('[ ERROR // ARCHIVE UPLINK FAILED // RETRY TRANSMISSION ]');
      }
    } catch (error) {
      console.error('Transmission error:', error);
      setIsTransmitting(false);
      setNetworkError('[ ERROR // NETWORK DROP // SECURE CHANNEL OFFLINE ]');
    }
  };

  const labelClass = 'block text-sm text-cyan-400/90 font-bold tracking-[0.18em] uppercase';
  const errorClass = 'text-xs text-amber-400 font-bold tracking-widest uppercase';
  const fieldBase =
    'w-full bg-slate-950/80 rounded-lg px-4 py-3.5 text-base text-slate-200 font-sans placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all border';
  const fieldOk = `${fieldBase} border-slate-800 focus:border-cyan-400/70 focus:ring-cyan-400/40`;
  const fieldWarn = `${fieldBase} border-amber-500/60 focus:border-amber-400 focus:ring-amber-500/30`;

  // Contact borders warn only when BOTH email and phone pipelines are missing
  const fieldClass = (key) => {
    if (key === 'email' || key === 'phone') {
      return errors.contact ? fieldWarn : fieldOk;
    }
    return errors[key] ? fieldWarn : fieldOk;
  };

  const hasValidationErrors = Object.keys(errors).length > 0;

  return (
    <div className="w-full h-full bg-[#01040a] text-white font-mono flex flex-col overflow-hidden relative animate-fade-in">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.06)_0%,transparent_55%)]" />

      {showThankYou && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#01040a]/80 backdrop-blur-md p-6 animate-fade-in">
          <div className="max-w-lg w-full border border-cyan-400/40 bg-slate-950/95 rounded-2xl px-8 py-10 text-center shadow-[0_0_48px_rgba(34,211,238,0.25)]">
            <div className="w-3.5 h-3.5 mx-auto mb-6 rounded-full bg-emerald-400 animate-ping shadow-[0_0_14px_rgba(52,211,153,0.85)]" />
            <p className="text-[10px] text-cyan-400/80 font-bold tracking-[0.25em] uppercase mb-4 animate-pulse">
              // TRANSMISSION SECURED
            </p>
            <p className="font-sans text-slate-100 text-lg md:text-xl leading-relaxed font-normal">
              Transmission Secured. Thank you—our laboratory team will cross-reference your matrix token and contact you
              shortly.
            </p>
            <p className="mt-6 text-xs text-slate-500 font-bold tracking-[0.2em] uppercase animate-pulse">
              [ RETURNING TO HOME MATRIX... ]
            </p>
          </div>
        </div>
      )}

      <div className="relative flex-1 overflow-y-auto px-4 md:px-8 py-10 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          <h1 className="font-mono text-cyan-400 text-2xl md:text-3xl tracking-widest uppercase mb-5 text-center font-black">
            // SYSTEM INITIALIZED // KNOW THYSELF BLUEPRINT MASTERY
          </h1>

          <p className="font-sans text-slate-300 text-base md:text-lg leading-relaxed text-center max-w-2xl mx-auto mb-10 font-normal">
            Welcome to your data-driven physical recovery and performance trajectory. Transmit your intake signature so
            our laboratory can calibrate your onsite blueprint route with precision.
          </p>

          {isTransmitting ? (
            <div className="border border-cyan-500/30 bg-slate-950/90 rounded-2xl p-12 text-center shadow-[0_0_40px_rgba(34,211,238,0.12)]">
              <div className="w-3.5 h-3.5 mx-auto mb-5 rounded-full bg-cyan-400 animate-ping shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
              <p className="text-cyan-400 font-black tracking-[0.2em] uppercase text-base md:text-lg animate-pulse">
                [ TRANSMITTING ENCRYPTED INTAKE PACKET... ]
              </p>
              <p className="text-slate-500 text-xs tracking-widest uppercase mt-3">
                SECURE ARCHIVE HANDSHAKE IN PROGRESS
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleTransmit}
              className="border border-slate-800/80 bg-slate-950/70 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl space-y-7"
              noValidate
            >
              <div className="space-y-2">
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full identity signature"
                  className={fieldClass('name')}
                  autoComplete="name"
                />
                {errors.name && <p className={errorClass}>{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your primary digital pipeline"
                  className={fieldClass('email')}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-3">
                <label className={labelClass}>Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your mobile terminal string"
                  className={fieldClass('phone')}
                  autoComplete="tel"
                />
                {errors.contact && (
                  <p className={errorClass}>EMAIL OR PHONE PIPELINE REQUIRED // PROVIDE AT LEAST ONE</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {CONTACT_PREFERENCES.map((pref) => {
                    const selected = form.contactPreference === pref.id;
                    return (
                      <button
                        key={pref.id}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, contactPreference: pref.id }))}
                        className={`px-4 py-3.5 rounded-lg border text-sm font-black tracking-widest uppercase transition-all cursor-pointer active:scale-95 ${
                          selected
                            ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.2)]'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        }`}
                      >
                        {pref.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Requested Date for Assessment</label>
                <input
                  type="text"
                  value={form.requestedDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, requestedDate: e.target.value }))}
                  placeholder="Select target date window or timeline preference..."
                  className={fieldOk}
                />
              </div>

              <div className="space-y-3">
                <label className={labelClass}>Optimal Contact Hours</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {CONTACT_HOURS.map((hour) => {
                    const checked = form.contactHours.includes(hour);
                    return (
                      <label
                        key={hour}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-lg border cursor-pointer transition-all ${
                          checked
                            ? 'border-cyan-400/60 bg-cyan-950/30'
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleHour(hour)}
                          className="accent-cyan-400 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-sm font-bold tracking-widest uppercase text-slate-300">{hour}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Movement Background / Goals Note</label>
                <textarea
                  value={form.goalsNote}
                  onChange={(e) => setForm((prev) => ({ ...prev, goalsNote: e.target.value }))}
                  placeholder="Describe movement history, current limitations, and performance targets..."
                  rows={5}
                  className={`${fieldOk} resize-y min-h-[120px]`}
                />
              </div>

              {hasValidationErrors && (
                <div className="border border-amber-500/50 bg-amber-950/30 rounded-lg px-4 py-3 text-center shadow-[0_0_18px_rgba(245,158,11,0.15)]">
                  <p className="text-amber-400 text-sm font-black tracking-[0.16em] uppercase animate-pulse">
                    [ ERROR // CRITICAL DATA PIPELINES INCOMPLETE ]
                  </p>
                </div>
              )}

              {networkError && (
                <div className="border border-red-500/40 bg-red-950/30 rounded-lg px-4 py-3 text-center shadow-[0_0_18px_rgba(239,68,68,0.12)]">
                  <p className="text-red-400 text-sm font-black tracking-[0.16em] uppercase animate-pulse">
                    {networkError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isTransmitting}
                className="w-full py-4 md:py-5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-sm md:text-base tracking-[0.18em] uppercase rounded-xl transition-all cursor-pointer active:scale-[0.98] shadow-[0_0_28px_rgba(34,211,238,0.35)] disabled:cursor-wait disabled:opacity-80"
              >
                [ TRANSMIT BLUEPRINT SCHEDULING ]
              </button>
            </form>
          )}

          <p className="mt-10 text-center text-xs md:text-sm text-slate-500 font-bold tracking-[0.16em] uppercase">
            ENCRYPTED SECURE DIRECT ARCHIVE ROUTE //{' '}
            {ARCHIVE_EMAIL_TARGET ? (
              <a
                href={`mailto:${ARCHIVE_EMAIL_TARGET}`}
                className="text-cyan-500/80 hover:text-cyan-400 transition-colors"
              >
                {String(ARCHIVE_EMAIL_TARGET).toUpperCase()}
              </a>
            ) : (
              <span className="text-slate-600">[ ARCHIVE CHANNEL LOCKED ]</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
