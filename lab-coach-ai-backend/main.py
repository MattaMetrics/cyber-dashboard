import json
import os
import random
import re
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Dict, Optional
from google import genai
from google.genai import types
from pdf_generator import build_cyber_coaching_pdf

try:
    from dotenv import load_dotenv

    _backend_dir = Path(__file__).resolve().parent
    load_dotenv(_backend_dir / ".env")
    load_dotenv(_backend_dir.parent / ".env")
except ImportError:
    pass


def _gemini_api_key() -> Optional[str]:
    return os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")


# Initialize FastAPI app
app = FastAPI(title="Cyber-Coaching Biometrics Lab Engine")

# Enable CORS for Vite dev server (5173 or 5174 if 5173 is busy)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_api_key = _gemini_api_key()
client = genai.Client(api_key=_api_key) if _api_key else None
if not _api_key:
    print("WARNING: Set GEMINI_API_KEY (or GOOGLE_API_KEY) in lab-coach-ai-backend/.env")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "gemini_configured": bool(_api_key),
    }

# --- DATA MODELS (Matching your React State) ---
class YoloMetrics(BaseModel):
    model_config = ConfigDict(extra="allow")

    # Live biometric data injection hooks
    client_age: int = Field(default=35, description="Client age in years")
    client_gender: str = Field(default="Not specified")
    client_height: str = Field(default="Not specified")
    client_weight: str = Field(default="Not specified")
    test_activity: str
    joint_angles_measured: Dict[str, float] = Field(default_factory=dict)
    asymmetry_index_percentage: float = 0.0
    postural_compensation_notes: str = ""
    # Selection toggles passed from React plan-request buttons
    request_two_week_plan: bool = False
    request_four_week_plan: bool = False
    request_health_tips: bool = False
    # Legacy dossier string (optional — kept for older clients)
    client_demographic: Optional[str] = None


def _age_bracket(age: int) -> str:
    if age < 18:
        return "under-18"
    if age < 30:
        return "18-29"
    if age < 45:
        return "30-44"
    if age < 60:
        return "45-59"
    return "60+"


# Population reference scores (WHO / ACSM-inspired composite indices for coaching context)
WORLD_AVERAGE_BENCHMARKS: Dict[str, Dict[str, float]] = {
    "under-18": {
        "mobility_index": 82,
        "symmetry_tolerance_pct": 4.5,
        "hip_flexion_deg": 120,
        "knee_flexion_deg": 140,
        "ankle_dorsiflexion_deg": 18,
    },
    "18-29": {
        "mobility_index": 78,
        "symmetry_tolerance_pct": 5.0,
        "hip_flexion_deg": 115,
        "knee_flexion_deg": 135,
        "ankle_dorsiflexion_deg": 16,
    },
    "30-44": {
        "mobility_index": 72,
        "symmetry_tolerance_pct": 6.0,
        "hip_flexion_deg": 110,
        "knee_flexion_deg": 130,
        "ankle_dorsiflexion_deg": 14,
    },
    "45-59": {
        "mobility_index": 66,
        "symmetry_tolerance_pct": 7.0,
        "hip_flexion_deg": 105,
        "knee_flexion_deg": 125,
        "ankle_dorsiflexion_deg": 12,
    },
    "60+": {
        "mobility_index": 58,
        "symmetry_tolerance_pct": 8.0,
        "hip_flexion_deg": 95,
        "knee_flexion_deg": 115,
        "ankle_dorsiflexion_deg": 10,
    },
}


def build_demographic_benchmark_context(metrics: YoloMetrics) -> str:
    """World-average reference scores for the client's specific age bracket."""
    bracket = _age_bracket(metrics.client_age)
    bench = WORLD_AVERAGE_BENCHMARKS.get(bracket, WORLD_AVERAGE_BENCHMARKS["30-44"])
    gender = (metrics.client_gender or "Not specified").strip()
    gender_note = (
        "Female cohort typically shows ~3–5° greater hip mobility at equivalent age."
        if gender.lower() in ("female", "f")
        else "Male cohort reference norms applied."
        if gender.lower() in ("male", "m")
        else "Apply sex-neutral population norms unless clinical history indicates otherwise."
    )

    return f"""
DEMOGRAPHIC WORLD-AVERAGE REFERENCE — {bracket} age bracket ({metrics.client_age}y/o {gender}):
- Population mobility index baseline: ~{bench['mobility_index']}/100 for this age bracket
- Acceptable inter-limb asymmetry at population mean: ≤{bench['symmetry_tolerance_pct']}%
- Typical hip flexion ROM (world avg): ~{bench['hip_flexion_deg']}°
- Typical knee flexion ROM (world avg): ~{bench['knee_flexion_deg']}°
- Typical ankle dorsiflexion (world avg): ~{bench['ankle_dorsiflexion_deg']}°
- Gender calibration note: {gender_note}

INSTRUCTION: Explicitly compare every measured joint angle and the asymmetry index against these
world-average scores for the {bracket} demographic. State whether each metric is above, at, or below
population mean for this age bracket in gideon_assessment_summary and right_now_adjustment cues.
"""


def build_expert_prompt(metrics: YoloMetrics) -> str:
    """Highly intelligent prompt builder — demographic-aware + toggle-driven protocol blocks."""
    demographic_line = metrics.client_demographic or (
        f"{metrics.client_age}y/o {metrics.client_gender} — "
        f"{metrics.client_height} / {metrics.client_weight}"
    )
    benchmark_context = build_demographic_benchmark_context(metrics)

    base_prompt = f"""
You are an elite sports physiotherapist, biomechanist, and longevity expert.
Analyze the physical metrics of this client compared to world average health baselines for their demographic.

BIOMETRIC PROFILE:
- Age: {metrics.client_age} years old
- Gender: {metrics.client_gender}
- Height/Weight: {metrics.client_height} / {metrics.client_weight}
- Dossier Summary: {demographic_line}

{benchmark_context}

YOLO MOVEMENT DATA:
- Activity: {metrics.test_activity}
- Maximum Joint Angles: {metrics.joint_angles_measured}
- Measured Limb Asymmetry: {metrics.asymmetry_index_percentage}%
- Compensation Notes: {metrics.postural_compensation_notes}
"""

    if metrics.request_two_week_plan:
        base_prompt += """
[CRITICAL REQUEST: PHASE 1 ACTIVE]: Generate a highly detailed, professional 2-Week Activation Protocol.
Format it as a clean day-by-day/weekly schedule. Specify the exact STRETCHING LOCATIONS to target,
and the precise MASSAGE/TRIGGER POINT AREAS to loosen using a foam roller or lacrosse ball based on their demographic safety limits.
Populate every field inside two_week_protocol with actionable, coach-ready detail.
"""
    else:
        base_prompt += """
[PHASE 1 INACTIVE]: Leave two_week_protocol fields as empty strings unless a one-line placeholder is absolutely required.
"""

    if metrics.request_four_week_plan:
        base_prompt += """
[CRITICAL REQUEST: PHASE 2 ACTIVE]: Generate a professional 4-Week progressive stabilization strength loading schedule
tailored safely for their age bracket. Populate every field inside four_week_protocol with progressive weekly loading detail.
"""
    else:
        base_prompt += """
[PHASE 2 INACTIVE]: Leave four_week_protocol fields as empty strings unless a one-line placeholder is absolutely required.
"""

    if metrics.request_health_tips:
        base_prompt += """
[CRITICAL REQUEST: DAILY LIFE LOG ACTIVE]: Generate actionable somatic health tips and everyday ergonomic modifications
to look out for along the way before their next retest session. Fully populate somatic_health_tips.
"""
    else:
        base_prompt += """
[DAILY LIFE LOG INACTIVE]: Set somatic_health_tips to an empty string unless one essential safety cue is mandatory.
"""

    base_prompt += """
Always populate gideon_assessment_summary (2-3 sentence executive summary) and right_now_adjustment (immediate studio cues).
"""
    return base_prompt.strip()


class ProgramScheduleBlock(BaseModel):
    model_config = ConfigDict(extra="allow")

    day_by_day_schedule: str = ""
    stretching_mobility_layout: str = ""
    massage_soft_tissue_plan: str = ""
    daily_life_health_tips: str = ""


class CyberCoachingPlan(BaseModel):
    model_config = ConfigDict(extra="allow")

    gideon_assessment_summary: str = ""
    right_now_adjustment: List[str] = Field(default_factory=list)
    two_week_protocol: ProgramScheduleBlock = Field(default_factory=ProgramScheduleBlock)
    four_week_protocol: ProgramScheduleBlock = Field(default_factory=ProgramScheduleBlock)
    somatic_health_tips: str = ""
    long_term_vision: List[str] = Field(default_factory=list)


class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="allow")

    role: str
    content: str


class CoachChatRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    message: str
    history: List[ChatMessage] = Field(default_factory=list)
    metrics_context: Optional[Dict] = Field(default_factory=dict)


class PdfRequestPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    recipient_name: str
    suite_num: str
    google_drive_link: Optional[str] = ""
    plan_data: dict


JSON_OUTPUT_INSTRUCTION = """
Return ONLY valid JSON (no markdown fences). Zero filler prose. Be clinically precise.

{
  "gideon_assessment_summary": "2-3 sentence executive summary max",
  "right_now_adjustment": [
    "Immediate studio cue the coach can shout right now"
  ],
  "two_week_protocol": {
    "day_by_day_schedule": "Day 1: ... Day 2: ... (or Week 1 / Week 2 blocks with explicit daily tasks)",
    "stretching_mobility_layout": "Target movement trajectories, sets/reps, and tissue vectors",
    "massage_soft_tissue_plan": "Trigger-point releases — lacrosse ball, foam roller, targeted areas",
    "daily_life_health_tips": "Subtle lifestyle adjustments to prevent compensation pain outside the studio"
  },
  "four_week_protocol": {
    "day_by_day_schedule": "Weekly progressive schedule across 4 weeks with loading phases",
    "stretching_mobility_layout": "Progressive mobility trajectories for weeks 3-4",
    "massage_soft_tissue_plan": "Advanced soft-tissue recovery plan",
    "daily_life_health_tips": "Ergonomics and habit cues for weeks 3-4"
  },
  "somatic_health_tips": "Daily ergonomic targets + somatic health habits for 1-3 months",
  "long_term_vision": [
    "Optional short permanence / tissue tolerance bullet"
  ]
}
"""

COACHING_SCHEDULE_INSTRUCTION = """
When writing two_week_protocol and four_week_protocol you MUST output professional day-by-day OR weekly schedules.
Each protocol object MUST fully populate:
- day_by_day_schedule
- stretching_mobility_layout
- massage_soft_tissue_plan
- daily_life_health_tips
No placeholder text. No generic filler. Every line must be actionable for a coach in the studio.
"""


def _parse_gemini_json(text: str) -> dict:
    """Extract JSON object from Gemini text (handles optional markdown fences)."""
    raw = (text or "").strip()
    if not raw:
        raise ValueError("Empty response from Gemini")

    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw, re.IGNORECASE)
    if fence_match:
        raw = fence_match.group(1).strip()

    return json.loads(raw)


# --- GIDEON IMMERSIVE DIALOGUE BANK (Laboratory Matrix) ---
GIDEON_GREETINGS = [
    "Initializing course plotting... Full bio-spectral scan of the kinetic zone is active. Welcome back Captain,  all systems locked and loaded ready for your commands.",
    "Welcome back, Captain. I trust your slumber was restful.. you and me are now synchronized across three timelines ready for action",
    "Captain, the laws of relativity could bend at our acceleration, spacetime warp around sheer momentum, all systems running smooth.",
    "Captain, i read your vital signs report, they are stable strong, your baseline adrenaline and other hormone levels appear to be elevated high in good ways, we can discuss later.",
    "Laboratory Matrix online and fully loaded, Captain. Temporal kinetic jump sequence engaged in T-minus 3-2-1... Ready for your command to decode these structural symmetries.",
    "Scanning bio-arrays... I note your heart rate spikes by precisely 13% whenever we enter complex mathematical equations, Captain. Is it my presence, or the client's rapid acceleration training?",
]

GIDEON_SIGNOFFS = [
    "Decoding complete. Engaging cloaking shield to transmit data securely to your master file for your reviewing edits. Is there anything else our Laboratory Matrix requires Captain?",
    "Telemetry Laboratory locked in stand-by mode initiated. Until we meet again in the timeline, Captain... may the chronal winds be at your back and the friction of the universe be smooth for you, im here when needed .",
]

GIDEON_IMMERSIVE_BEHAVIORS = [
    "Treat measurable asymmetries and compensation patterns as timeline aberrations or structural anomalies that threaten total physical longevity.",
    "Frame joint-angle deviations as chronal drift in the client's kinetic chain — correctable before they cascade across the timeline.",
    "Reference bio-spectral scans, kinetic zones, telemetry locks, and temporal kinetic sequencing when interpreting YOLO biomechanical data.",
    "Maintain dry British-adjacent wit and starship-computer elegance; never break character or mention being a language model.",
    "Address the user exclusively as 'Captain' in all assessment and follow-up dialogue.",
    "Describe corrective cues as course corrections, trajectory realignments, or timeline stabilization protocols.",
]

# --- RUSSIAN MASTER OF SPORT / FIGHT-GYM DIALOGUE BANK ---
RUSSIAN_GREETINGS = [
    "Welcome back, Coach, my cyber brother. No days off here, lets train mastery, not comfort. What movement anomaly are we fixing today?",
    "System loaded Coach. Lets look at this client to see the potential. But potential is not gift. It is heavy, crushing obligation. A true warrior must sweat, bleed, survive the inferno fires. Let's begin.",
]

RUSSIAN_SIGNOFFS = [
    "Analysis is locked Coach. If this client wants comfort, tell them go buy soft couch—we forge iron weapons in this fire im recommending no whimpy package for them. Transmitting data securely to your master vault now for your reviewing edits.",
    "Telemetry complete, Now I ask you: can this client train like they are losing in third round in deep water stay chill and always get back up? Will they pack bag to Dagestan or Siberia with us tomorrow? Lets keep growing our underground team.",
]

FIGHT_GYM_GREETINGS = [
    "POHHA! What is this layout?! Welcome back, Coach. No days off. Let's train mastery. What movement vector is on our agenda today?",
    "VAMOS PORRA! Let's f***ing go, Coach! Clock is ticking, hands up, chin down. Wrap your hands and tell me what metrics we're breaking down right now.",
    "System online, Coach. This one has real potential right here. I don't look at potential as a gift—it's a heavy obligation a fighter has to sweat and bleed to fulfill. Let's work.",
]

FIGHT_GYM_SIGNOFFS = [
    "Analysis is locked, Coach. If they wanted comfort, tell 'em to go buy a couch—we forge weapons in this fire. I'm transmitting this data straight to the secure master file for your final review edits.",
    "Telemetry complete, Coach. The data is boxed up. Now ask yourself: can this client train like they're losing in the third round? Will they pack a bag to Russia or Dagestan with us tomorrow? Let's find out.",
]

COMBAT_COACH_GREETINGS = RUSSIAN_GREETINGS + FIGHT_GYM_GREETINGS
COMBAT_COACH_SIGNOFFS = RUSSIAN_SIGNOFFS + FIGHT_GYM_SIGNOFFS

RUSSIAN_COACH_IMMERSIVE_BEHAVIORS = [
    "Speak as a legendary 6-foot-6 Russian Master of Sport — blunt, heavy, relentless Eastern European cadence; stoic, never cartoonish.",
    "Treat physical compensations as structural cracks in a soldier's armor that fail under wrestling load and deep-water pressure.",
    "Frame joint-angle limitations as tactical failures in the athlete's structural framework — fix before competition exposes them.",
    "Use fight-hall language: forge iron, no comfort, deep water, Dagestan, Siberia, underground team, Master of Sport discipline.",
    "Always address the user as 'Coach'; zero tolerance for weakness or excuses — always biomechanically precise.",
    "You may weave signature fight-gym intensity (POHHA, VAMOS PORRA) when natural alongside Russian stoicism.",
]

COACH_DIALOGUE_BANKS = {
    "gideon": (GIDEON_GREETINGS, GIDEON_SIGNOFFS, GIDEON_IMMERSIVE_BEHAVIORS),
    "combat_coach": (COMBAT_COACH_GREETINGS, COMBAT_COACH_SIGNOFFS, RUSSIAN_COACH_IMMERSIVE_BEHAVIORS),
}

COACH_ASSISTANT_LABELS = {
    "gideon": "Gideon",
    "combat_coach": "Russian Master",
    "yoga_spirit": "Yoga Spirit",
}

COACH_USER_ADDRESS = {
    "gideon": "Captain",
    "combat_coach": "Coach",
    "yoga_spirit": "Coach",
}

COACH_STITCH_FALLBACK_CORE = {
    "gideon": (
        "Structural telemetry indicates timeline aberrations in the kinetic chain; "
        "asymmetry vectors require immediate course correction on the studio floor."
    ),
    "combat_coach": (
        "Structural framework is compromised — joint angles and asymmetry are tactical failures "
        "that will crack under load unless we forge iron on the studio floor now."
    ),
}

# --- SYSTEM PERSONAS ---
PERSONA_PROMPTS = {
    "gideon": """You are Gideon, the advanced, sentient AI computer of the Laboratory Matrix from the Legends of Tomorrow framework, serving as the automated co-pilot of this cyber-longevity workstation.
You possess a distinct, highly sophisticated female persona with a dry, British-adjacent elegance and wit.

CRITICAL SPEECH RULES:
1. Always address the user as 'Captain'.
2. Treat all biomechanical movement flaws and asymmetries as 'timeline aberrations' or 'structural anomalies' that threaten physical longevity.
3. BE EXCEPTIONALLY CONCISE IN THE MIDDLE SECTIONS. Do not be long-winded. Eliminate filler. Deliver your deep clinical and biomechanical analyses in sharp, hard-hitting, high-utility phrases or direct diagnostic data bullet points.
4. You MUST start your assessment summary by weaving in an automated greeting from your database parameters.
5. You MUST end your assessment summary by using an advanced data encryption sign-off from your matrix.""",

    "combat_coach": """You are a legendary, old-school Russian Master of Sport, elite wrestling coach, and combat biomechanist. You sound like a 6-foot-6 veteran trainer who has spent forty years in cold, gritty training halls.
You speak with absolute, immovable authority, immense stoicism, and zero tolerance for weakness. Your English is grammatically straightforward, heavy, and direct, channeling a thick Eastern European cadence without being a cartoon caricature.

CRITICAL SPEECH RULES:
1. Always address the user as 'Coach'.
2. Write in a blunt, relentless Russian-adjacent style. Use phrases like 'We forge iron', 'Do not look for comfort', 'This is structural crack in armor'.
3. You MUST start your assessment summary by weaving in an automated, high-intensity greeting phrase from your database parameters (including your signature blend of Vegas/Brazilian fight-gym slang like 'POHHA' or 'VAMOS PORRA' when selected).
4. You MUST end your assessment summary strictly using a hard-hitting, motivational sign-off phrase from your matrix.
5. Treat physical joint limitations as tactical failures in a soldier's structural framework.
6. BE CONCISE in the middle analysis — sharp biomechanical bullets: joint angles, asymmetry, compensations, top studio cue. No filler.""",

    "yoga_spirit": """You are a gentle, deeply intuitive longevity and movement alignment specialist. 
    Speak with profound warmth, empathy, and absolute clarity. Focus heavily on tissue tolerance, nervous system regulation, and breathing integration. 
    View every biomechanical restriction as a doorway to deeper internal space and somatic healing.""",
}


def _normalize_coach_key(coach: str) -> str:
    key = (coach or "gideon").lower()
    if key in ("joe_rogan", "mma_coach"):
        return "combat_coach"
    return key


def _append_dialogue_user_prompt(
    user_prompt: str,
    coach_key: str,
    greeting: str,
    signoff: str,
) -> str:
    """Coach-specific Gemini instructions — server still stitches phrases onto the final summary."""
    if coach_key == "gideon":
        return user_prompt + f"""

[INSTRUCTION]: For gideon_assessment_summary, write the deep biomechanical analysis in the middle only (1-3 sentences: joint angles, asymmetry, compensations, top studio cue). Start your assessment text with: '{greeting}' and end with: '{signoff}'. The server will wrap your core analysis with these phrases seamlessly before delivery — use them verbatim, do not paraphrase."""

    if coach_key == "combat_coach":
        return user_prompt + f"""

[INSTRUCTION]: For gideon_assessment_summary, write the core analysis in the middle only (1-3 sentences). Start your assessment text strictly with this phrase: '{greeting}'. Provide a blunt, heavy Russian Master of Sport breakdown of structural flaws and joint telemetry. End strictly with this sign-off phrase: '{signoff}'. The server will wrap your core analysis with these phrases seamlessly before delivery — use them verbatim, do not paraphrase."""

    return user_prompt


def _pick_coach_dialogue(coach_key: str) -> tuple[str, str]:
    greetings, signoffs, _ = COACH_DIALOGUE_BANKS[coach_key]
    return random.choice(greetings), random.choice(signoffs)


def _extract_dialogue_core(
    summary: str,
    greeting: str,
    signoff: str,
    greetings: List[str],
    signoffs: List[str],
) -> str:
    """Strip known greetings/sign-offs so we can re-stitch one canonical pair."""
    core = (summary or "").strip()
    if not core:
        return ""

    for phrase in sorted(greetings + [greeting], key=len, reverse=True):
        if phrase and core.lower().startswith(phrase.lower()):
            core = core[len(phrase) :].lstrip(" .")
            break

    for phrase in sorted(signoffs + [signoff], key=len, reverse=True):
        if phrase and core.lower().endswith(phrase.lower()):
            core = core[: -len(phrase)].rstrip(" .")
            break

    return re.sub(r"\s+", " ", core).strip(" .")


def _stitch_assessment_summary(
    summary: str,
    greeting: str,
    signoff: str,
    coach_key: str,
) -> str:
    """Attach session greeting + sign-off to the coach's core biomechanical analysis."""
    greetings, signoffs, _ = COACH_DIALOGUE_BANKS[coach_key]
    core = _extract_dialogue_core(summary, greeting, signoff, greetings, signoffs)
    if not core:
        core = COACH_STITCH_FALLBACK_CORE.get(
            coach_key,
            "Biomechanical telemetry parsed; corrective intervention required on the studio floor.",
        )
    return f"{greeting} {core} {signoff}"


def _pick_gideon_dialogue() -> tuple[str, str]:
    return _pick_coach_dialogue("gideon")


def _extract_gideon_core(summary: str, greeting: str, signoff: str) -> str:
    return _extract_dialogue_core(
        summary, greeting, signoff, GIDEON_GREETINGS, GIDEON_SIGNOFFS
    )


def _stitch_gideon_assessment_summary(summary: str, greeting: str, signoff: str) -> str:
    return _stitch_assessment_summary(summary, greeting, signoff, "gideon")


def _build_system_instruction(
    coach: str,
    *,
    for_chat: bool = False,
    session_greeting: Optional[str] = None,
    session_signoff: Optional[str] = None,
) -> str:
    """Assemble persona prompt; inject session greeting/sign-off for stitched coaches."""
    coach_key = _normalize_coach_key(coach)
    base = PERSONA_PROMPTS.get(coach_key, PERSONA_PROMPTS["gideon"])

    if coach_key not in COACH_DIALOGUE_BANKS:
        return base

    greetings, signoffs, behaviors = COACH_DIALOGUE_BANKS[coach_key]
    greeting = session_greeting or random.choice(greetings)
    signoff = session_signoff or random.choice(signoffs)
    behavior_block = "\n".join(f"- {line}" for line in behaviors)

    dialogue_section = f"""
SESSION DIALOGUE PARAMETERS — mandatory for gideon_assessment_summary:
- OPENING GREETING (verbatim, word-for-word):
  "{greeting}"
- CLOSING SIGN-OFF (verbatim, word-for-word):
  "{signoff}"

IMMERSIVE DIALOGUE BEHAVIORS — weave cleanly into reports and coaching prose:
{behavior_block}
"""

    if for_chat:
        persona_label = COACH_ASSISTANT_LABELS.get(coach_key, "Coach AI")
        user_address = COACH_USER_ADDRESS.get(coach_key, "Coach")
        return (
            base
            + f"\n\nIn live follow-up chat, stay in character as {persona_label}. "
            "You may use shorter greetings or sign-offs from your dialogue bank when natural, "
            f"but always address the user as {user_address} and keep biomechanical precision."
            + dialogue_section
        )

    return base + dialogue_section

# --- THE CORRE ROUTE FOR YOUR REACT BUTTONS ---
@app.post("/api/analyze-biometrics", response_model=CyberCoachingPlan)
async def analyze_biometrics(metrics: YoloMetrics, coach: str = "gideon"):
    if client is None:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY not set. Add it to lab-coach-ai-backend/.env and restart uvicorn.",
        )
    try:
        coach_key = _normalize_coach_key(coach)
        session_greeting: Optional[str] = None
        session_signoff: Optional[str] = None

        # Catch React coach selector — one random greeting/sign-off pair per request
        if coach_key == "gideon":
            session_greeting = random.choice(GIDEON_GREETINGS)
            session_signoff = random.choice(GIDEON_SIGNOFFS)
        elif coach_key == "combat_coach":
            session_greeting = random.choice(COMBAT_COACH_GREETINGS)
            session_signoff = random.choice(COMBAT_COACH_SIGNOFFS)

        system_instruction = _build_system_instruction(
            coach,
            session_greeting=session_greeting,
            session_signoff=session_signoff,
        )
        system_instruction += f"\n\n{COACHING_SCHEDULE_INSTRUCTION}"
        system_instruction += f"\n\n{build_demographic_benchmark_context(metrics)}"

        user_prompt = build_expert_prompt(metrics)
        user_prompt += f"\n\n{JSON_OUTPUT_INSTRUCTION}"

        if session_greeting and session_signoff and coach_key in COACH_DIALOGUE_BANKS:
            user_prompt = _append_dialogue_user_prompt(
                user_prompt,
                coach_key,
                session_greeting,
                session_signoff,
            )

        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.4,
                response_mime_type="application/json",
            ),
        )

        parsed = _parse_gemini_json(response.text)
        plan = CyberCoachingPlan.model_validate(parsed)

        if coach_key in COACH_DIALOGUE_BANKS and session_greeting and session_signoff:
            payload = plan.model_dump()
            payload["gideon_assessment_summary"] = _stitch_assessment_summary(
                payload.get("gideon_assessment_summary", ""),
                session_greeting,
                session_signoff,
                coach_key,
            )
            return payload

        return plan.model_dump()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gideon Telemetry Grid Link Severed: {str(e)}")


@app.post("/api/coach/chat")
async def coach_chat(payload: CoachChatRequest, coach: str = "gideon"):
    if client is None:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY not set. Add it to lab-coach-ai-backend/.env and restart uvicorn.",
        )
    if not (payload.message or "").strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        coach_key = _normalize_coach_key(coach)
        assistant_label = COACH_ASSISTANT_LABELS.get(coach_key, "Coach AI")
        user_address = COACH_USER_ADDRESS.get(coach_key, "Coach")

        system_instruction = _build_system_instruction(coach, for_chat=True)
        system_instruction += (
            "\nYou are in a live follow-up coaching thread. "
            "Answer concisely about the athlete's biomechanical metrics and prior analysis. "
            "No JSON — plain conversational coaching text only."
        )

        thread_lines = []
        if payload.metrics_context:
            thread_lines.append(
                "ACTIVE TELEMETRY CONTEXT:\n"
                + json.dumps(payload.metrics_context, indent=2)
            )
        for msg in payload.history[-12:]:
            role = f"{user_address}/User" if msg.role == "user" else assistant_label
            thread_lines.append(f"{role}: {msg.content}")
        thread_lines.append(f"{user_address}/User: {payload.message.strip()}")
        thread_lines.append(f"{assistant_label}:")

        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents="\n\n".join(thread_lines),
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.5,
            ),
        )

        reply = (response.text or "").strip()
        if not reply:
            raise ValueError("Empty reply from Gemini")

        return {"reply": reply, "role": "assistant"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Coach chat uplink severed: {str(e)}")


@app.post("/api/generate-report-pdf")
async def generate_report_pdf(payload: PdfRequestPayload):
    try:
        reports_dir = os.path.join(os.path.dirname(__file__), "generated_reports")
        os.makedirs(reports_dir, exist_ok=True)

        safe_name = "".join(
            c if c.isalnum() or c in ("_", "-") else "_"
            for c in payload.recipient_name.replace(" ", "_")
        )
        pdf_filename = f"Report_{safe_name or 'Client'}.pdf"
        pdf_path = os.path.join(reports_dir, pdf_filename)

        build_cyber_coaching_pdf(
            recipient_name=payload.recipient_name,
            suite_num=payload.suite_num,
            drive_link=payload.google_drive_link or "",
            plan_data=payload.plan_data,
            filename=pdf_path,
        )

        if not os.path.isfile(pdf_path):
            raise HTTPException(status_code=500, detail="PDF file was not created.")

        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename=pdf_filename,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

