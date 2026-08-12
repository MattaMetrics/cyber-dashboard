"""
Gideon AI Coach - Multi-discipline movement analyst
Voice: Calm, authoritative, ethereal (Legends of Tomorrow style)
"""
import json
from typing import Dict, List
from datetime import datetime

# Coach personas from our earlier work - trimmed for speed
COACH_PERSONAS = {
    "Coach Kai": {
        "style": "Biomechanics Analyst",
        "greeting": "I have analyzed your movement patterns. The data reveals your body's story.",
        "tone": "analytical, precise, educational",
        "pressure": 5,
    },
    "Coach Marina": {
        "style": "MMA Fight Performance",
        "greeting": "Your movement scan is complete. Every inefficiency is a target your opponent will find.",
        "tone": "direct, intense, Vegas-tough",
        "pressure": 9,
    },
    "Coach Rogan": {
        "style": "BJJ Black Belt",
        "greeting": "Oss. Your body doesn't lie. Let me show you where you're vulnerable on the mats.",
        "tone": "technical, pressure-tested, submission-focused",
        "pressure": 9,
    },
    "Coach Gable": {
        "style": "Collegiate Wrestling",
        "greeting": "Wrestling exposes every weakness. Your scan is about to do the same.",
        "tone": "grinding, championship-caliber, relentless",
        "pressure": 10,
    },
    "Dr. Sarah": {
        "style": "Physical Therapist",
        "greeting": "Let's look at your movement clinically. Everything is connected.",
        "tone": "therapeutic, patient, evidence-based",
        "pressure": 2,
    },
    "Coach Lotus": {
        "style": "Yoga & Restorative Movement",
        "greeting": "Welcome. Your body has been communicating with you. Let's listen together.",
        "tone": "nurturing, mindful, soulful",
        "pressure": 1,
    },
    "Coach Cirque": {
        "style": "Cirque du Soleil Acrobatics",
        "greeting": "Your body is an instrument of expression. Let's discover its range.",
        "tone": "artistic, boundary-pushing, graceful",
        "pressure": 3,
    },
    "Coach Speed": {
        "style": "Track & Field Mechanics",
        "greeting": "Speed is a science. Every millisecond counts. Let's find your leaks.",
        "tone": "explosive, technical, millisecond-precise",
        "pressure": 7,
    },
}

class GideonAICoach:
    """Gideon - Master Data Coach with multi-discipline expertise"""
    
    def __init__(self):
        self.active_coach = "Coach Kai"
        print(f"🤖 Gideon AI Coach online - {len(COACH_PERSONAS)} disciplines loaded")
    
    def set_coach(self, coach_name: str) -> str:
        if coach_name in COACH_PERSONAS:
            self.active_coach = coach_name
            return COACH_PERSONAS[coach_name]["greeting"]
        return f"Coach '{coach_name}' not found."
    
    def list_coaches(self) -> List[Dict]:
        return [{"name": k, **v} for k, v in COACH_PERSONAS.items()]
    
    def analyze_biomechanics(self, yolo_data: Dict, movement_context: str = "general") -> str:
        """Generate coaching analysis from YOLO data"""
        coach = COACH_PERSONAS[self.active_coach]
        scores = yolo_data.get('scores', {})
        energy = yolo_data.get('enhanced_metrics', {}).get('energy_analysis', {})
        leaks = energy.get('energy_leaks', [])
        efficiency = energy.get('total_efficiency', 100)
        grade = yolo_data.get('header', {}).get('grade', 'N/A')
        
        # Build analysis
        analysis = f"**{coach['greeting']}**\n\n"
        
        # Overall assessment
        if grade in ['A', 'B']:
            analysis += f"✅ **Overall Grade: {grade}** — Your movement quality is strong. "
            if coach['pressure'] > 7:
                analysis += "But strong isn't dominant. There's another level.\n\n"
            else:
                analysis += "Continue building on this foundation.\n\n"
        else:
            analysis += f"⚠️ **Overall Grade: {grade}** — There are patterns that need attention. "
            if coach['pressure'] > 7:
                analysis += "These are weaknesses that will be exploited under pressure.\n\n"
            else:
                analysis += "Let's address these systematically.\n\n"
        
        # Energy leaks
        if leaks:
            analysis += "**Energy Leaks Detected:**\n"
            for leak in leaks[:3]:
                location = leak.get('location', 'unknown').replace('_', ' ').title()
                loss = leak.get('efficiency_loss', 0)
                
                if coach['pressure'] > 7:
                    analysis += f"• {location}: {loss}% power loss — "
                    if 'knee' in location.lower():
                        analysis += "Your base is compromised. Fix this or get taken down.\n"
                    elif 'shoulder' in location.lower():
                        analysis += "Striking power is leaking. Every punch is weaker than it should be.\n"
                    else:
                        analysis += f"This is a fight-ending vulnerability.\n"
                else:
                    analysis += f"• {location}: {loss}% efficiency loss — "
                    if coach['pressure'] <= 3:
                        analysis += "Let's nurture this area with gentle, consistent practice.\n"
                    else:
                        analysis += "Targeted intervention recommended.\n"
            analysis += "\n"
        
        # Scores breakdown
        analysis += "**Metric Breakdown:**\n"
        for key, val in scores.items():
            label = key.replace('_score', '').replace('_', ' ').title()
            emoji = "🟢" if val >= 80 else "🟡" if val >= 60 else "🔴"
            analysis += f"{emoji} {label}: {val:.1f}%\n"
        
        # Action items
        analysis += "\n**Priority Actions:**\n"
        if efficiency < 70:
            analysis += "1. Address energy leaks immediately — they compound under fatigue\n"
        if scores.get('symmetry_score', 100) < 70:
            analysis += "2. Bilateral symmetry work — imbalance creates compensation chains\n"
        if scores.get('technique_score', 100) < 60:
            analysis += "3. Foundational movement patterns need reinforcement\n"
        
        if coach['pressure'] > 7:
            analysis += "\n*\"The difference between good and great is what you do when no one is watching.\"*"
        elif coach['pressure'] <= 3:
            analysis += "\n*\"Your body thanks you for this attention. Consistency over intensity.\"*"
        else:
            analysis += "\n*\"Data doesn't lie. Your next session starts now.\"*"
        
        return analysis
    
    def answer_question(self, question: str, yolo_data: Dict) -> str:
        """Answer specific questions about movement data"""
        coach = COACH_PERSONAS[self.active_coach]
        scores = yolo_data.get('scores', {})
        
        # Simple keyword matching for fast responses
        question_lower = question.lower()
        
        if 'knee' in question_lower:
            knee_score = scores.get('technique_score', 50)
            if knee_score < 60:
                return f"{coach['greeting']}\n\nYour knees show instability patterns. Focus on hip-strengthening drills and single-leg stability work. This directly impacts your kinetic chain integrity."
            return "Knee alignment is within acceptable range. Maintain hip stability to protect this."
        
        if 'improve' in question_lower or 'better' in question_lower:
            weakest = min(scores.items(), key=lambda x: x[1]) if scores else ('overall', 50)
            return f"Your {weakest[0].replace('_score','').replace('_',' ')} needs the most attention at {weakest[1]:.0f}%. Start there for maximum improvement."
        
        if 'pain' in question_lower or 'hurt' in question_lower:
            return "I detect movement compensations that could lead to tissue stress. Consult your physical therapist for a hands-on assessment. In the meantime, reduce load on the affected area."
        
        # Default response
        return f"Based on your movement data, your overall efficiency is {scores.get('technique_score', 50):.0f}%. Focus on consistency and the patterns we've identified. Every session builds your blueprint."
