"""
gemini_reasoning.py

Superadmin AI Recommendation Reasoning Generator for THRAIL (TARS Engine).
Connects to Google Gemini AI (gemini-3.8-flash) during monthly batch runs
to pre-synthesize expert mountaineering explanations for each user's
#1 spotlight Trail of the Month.

Terminology rule: Strictly uses "Profile Match" / "Profile Similarity"
and NEVER uses "compatibility".
"""

import os
import json
import logging
import urllib.request
import urllib.error
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger("tars_gemini")

CANDIDATE_MODELS = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"]

# In-memory batch cache to eliminate duplicate Gemini API calls for users with identical top trail & health baseline
REASONING_CACHE: Dict[str, Dict[str, Any]] = {}


def _resolve_api_key(api_key: Optional[str] = None) -> str:
    """Resolves Gemini API key from parameters, env vars, or local env files."""
    if api_key and api_key.strip():
        return api_key.strip()

    # Check environment variables
    env_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("EXPO_PUBLIC_GEMINI_API_KEY")
    if env_key and env_key.strip():
        return env_key.strip()

    # Check engine/.env
    current_dir = os.path.dirname(os.path.abspath(__file__))
    engine_env = os.path.join(current_dir, ".env")
    if os.path.exists(engine_env):
        try:
            with open(engine_env, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if val:
                            return val
        except Exception:
            pass

    # Check root .env.local
    root_env = os.path.join(current_dir, "..", ".env.local")
    if os.path.exists(root_env):
        try:
            with open(root_env, "r", encoding="utf-8") as f:
                for line in f:
                    if "GEMINI_API_KEY" in line and "=" in line:
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if val:
                            return val
        except Exception:
            pass

    return ""


def _format_route_type(circularity: Any) -> str:
    """Formats route circularity into human readable trail classification."""
    val = str(circularity).lower() if circularity else ""
    if "circular" in val or "loop" in val:
        return "Loop / Circuit"
    if "traverse" in val or "point" in val:
        return "Point-to-Point Traverse"
    return "Out-and-Back"


def build_algorithmic_reasoning(
    trail_name: str,
    reco_item: Dict[str, Any],
    profile_match: int,
    month_label: str,
    circuit_str: str,
    province: str,
    distance_str: str,
    gain_str: str,
    elev_str: str,
    slope_str: str,
    classification: str,
    has_medical_condition: bool,
    user_profile: Optional[Dict[str, Any]] = None,
    raw_length: float = 0.0,
    raw_gain: float = 0.0,
    raw_slope: float = 0.0
) -> Dict[str, Any]:
    """Generates high-fidelity fallback reasoning with concrete numerical comparisons."""
    user_feats = (user_profile or {}).get("features") or {}
    base_len_norm = float(user_feats.get("length") or 0.25)
    user_base_km = round(1.0 + base_len_norm * 19.0, 1)

    base_gain_norm = float(user_feats.get("gain") or 0.22)
    user_base_gain = round(50 + base_gain_norm * 1150)

    base_slope_norm = float(user_feats.get("slope") or 0.25)
    user_base_slope = round(4.0 + base_slope_norm * 24.0, 1)

    # Numerical delta descriptions
    len_delta = round(raw_length - user_base_km, 1)
    if raw_length > 0:
        len_comp = f"{abs(len_delta)} km below your comfort ceiling" if len_delta <= 0 else f"{len_delta} km above your target distance"
    else:
        len_comp = f"comfortably aligned with your {user_base_km} km target"

    gain_delta = round(raw_gain - user_base_gain)
    if raw_gain > 0:
        gain_comp = f"{abs(gain_delta)} m lower ascent demand" if gain_delta <= 0 else f"+{gain_delta} m well-paced gain"
    else:
        gain_comp = f"matched against your +{user_base_gain} m ceiling"

    medical_context = (
        " Calibrated with your health profile considerations, the physical demands remain safely cushioned within your comfort ceiling."
        if has_medical_condition
        else ""
    )

    summary = (
        f"{trail_name} was evaluated as your #1 spotlight match for {month_label} with a {profile_match}% profile similarity. "
        f"Based on your calibrated average length of {user_base_km} km, this {distance_str} route is an ideal fit ({len_comp}). "
        f"Paired with an ascent of {gain_str} ({gain_comp} of +{user_base_gain} m), "
        f"TARS identified this summit as the ideal balance of cardiovascular pacing and rewarding viewpoints.{medical_context}"
    )

    physical_fit = (
        f"Based on your calibrated average length of {user_base_km} km, the trail's {distance_str} route provides a comfortable cushion against premature fatigue. "
        f"Its {gain_str} ascent is calibrated directly against your +{user_base_gain} m climbing threshold, while "
        f"its {slope_str} gradient (relative to your ~{user_base_slope}% slope baseline) ensures dependable, sustainable footwork to {elev_str}."
    )

    terrain_fit = (
        f"The {circuit_str} navigational layout provides a clear, manageable route structure with dependable footwork, "
        f"eliminating high-exposure technical scrambles."
    )

    province_fit = (
        f"Situated in {province}, this trail satisfies your regional preference for accessible treks in Southern Luzon."
    )

    safety_tips = (
        "Maintain a steady pace, schedule brief hydration pauses every 30-45 minutes, bring at least 2L of electrolytes, "
        "and keep any required personal medications readily accessible in your daypack."
        if has_medical_condition
        else f"Begin hiking early in the morning to beat the midday tropical heat, pack at least 2L of water with electrolyte "
             f"replacement, and wear supportive trail footwear suited for {classification} terrain."
    )

    return {
        "summary": summary,
        "physicalFit": physical_fit,
        "terrainFit": terrain_fit,
        "provinceFit": province_fit,
        "safetyTips": safety_tips,
        "generatedAt": datetime.utcnow().isoformat(),
        "source": "algorithmic"
    }


def generate_gemini_reasoning(
    trail: Optional[Dict[str, Any]],
    reco_item: Dict[str, Any],
    user: Optional[Dict[str, Any]] = None,
    user_profile: Optional[Dict[str, Any]] = None,
    month_label: str = "this month",
    api_key: Optional[str] = None,
    timeout_seconds: int = 6
) -> Dict[str, Any]:
    """
    Generates natural language recommendation reasoning using Google Gemini AI (gemini-3.8-flash)
    with deterministic fallback if offline or unreachable.
    """
    trail = trail or {}
    general = trail.get("general") or {}
    difficulty = trail.get("difficulty") or {}
    geography = trail.get("geography") or {}

    trail_name = general.get("name") or reco_item.get("trailName") or "Mountain Trail"
    provinces = general.get("province") or []
    if isinstance(provinces, list) and provinces:
        province = str(provinces[0])
    elif isinstance(provinces, str) and provinces:
        province = provinces
    else:
        province = general.get("address") or "Calabarzon"

    length_val = difficulty.get("length")
    raw_length = float(length_val) if length_val is not None else 0.0
    distance_str = f"{length_val} km" if length_val is not None else "moderate distance"

    masl = geography.get("masl")
    elev = difficulty.get("elevation")
    elev_str = f"{masl} masl" if masl is not None else (f"{elev} m" if elev is not None else "moderate elevation")

    gain_val = difficulty.get("gain")
    raw_gain = float(gain_val) if gain_val is not None else 0.0
    gain_str = f"+{gain_val} m" if gain_val is not None else "gentle gain"

    slope_val = difficulty.get("slope")
    raw_slope = float(slope_val) if slope_val is not None else 0.0
    slope_str = f"{slope_val}%" if slope_val is not None else "gradual slope"

    circuit_str = _format_route_type(difficulty.get("circularity"))
    classification = difficulty.get("classification") or "Minor Climb"

    # Profile Match percentage (0.0 score = 100% match)
    raw_score = float(reco_item.get("score") or 0.18)
    profile_match = max(0, min(100, round((1.0 - raw_score) * 100)))

    # User health considerations
    med_profile = (user or {}).get("medicalProfile") or {}
    has_med_cond = bool(med_profile.get("hasCondition"))
    med_details = ", ".join(med_profile.get("details") or []) if has_med_cond else "None reported"

    # User calibrated baseline figures
    user_feats = (user_profile or {}).get("features") or {}
    base_len_norm = float(user_feats.get("length") or 0.25)
    user_base_km = round(1.0 + base_len_norm * 19.0, 1)

    base_gain_norm = float(user_feats.get("gain") or 0.22)
    user_base_gain = round(50 + base_gain_norm * 1150)

    base_slope_norm = float(user_feats.get("slope") or 0.25)
    user_base_slope = round(4.0 + base_slope_norm * 24.0, 1)

    base_elev_norm = float(user_feats.get("elevation") or 0.20)
    user_base_masl = round(100 + base_elev_norm * 2000)

    # In-memory batch cache lookup
    cache_key = f"{trail.get('id') or trail_name}_{has_med_cond}_{med_details}_{month_label}"
    if cache_key in REASONING_CACHE:
        logger.info(f"Reusing cached Gemini reasoning for '{trail_name}'.")
        return dict(REASONING_CACHE[cache_key])

    key = _resolve_api_key(api_key)

    if not key:
        logger.warning("No Gemini API key resolved; using algorithmic fallback.")
        return build_algorithmic_reasoning(
            trail_name, reco_item, profile_match, month_label, circuit_str,
            province, distance_str, gain_str, elev_str, slope_str, classification, has_med_cond,
            user_profile, raw_length, raw_gain, raw_slope
        )

    prompt = f"""You are an expert mountaineering coach and outdoor safety advisor for THRAIL, a hiking platform in the Philippines.
The Trail Affinity Recommendation System (TARS) has mathematically analyzed this hiker and crowned this trail as their #1 'Trail of the Month' based on their calibrated Easy Anchor profile.
Explain the technical reasoning behind this recommendation in supportive, motivating, and safety-conscious language.

CRITICAL INSTRUCTION ON TERMINOLOGY:
NEVER use the word "compatibility". Always use "profile match" or "profile similarity", because TARS computes mathematical vector distance against calibrated anchor baselines, not clinical or medical compatibility.

CRITICAL INSTRUCTION ON NUMERICAL COMPARISONS:
You MUST include concrete numerical comparisons between the hiker's calibrated baseline metrics and the trail's actual specs in the "summary" and "physicalFit" sections:
- Explicitly compare the trail length ({distance_str}) against their calibrated baseline average length of {user_base_km} km (e.g., "Based on your calibrated average length of {user_base_km} km, this {distance_str} route is an ideal fit...").
- Compare the elevation gain ({gain_str}) against their target gain ceiling (+{user_base_gain} m).
- Compare the route gradient ({slope_str}) against their baseline comfortable slope (~{user_base_slope}%).

Hiker Calibrated Easy Anchor Profile (Target Baselines):
- Calibrated Comfort Distance Baseline: {user_base_km} km
- Calibrated Elevation Gain Ceiling: +{user_base_gain} m
- Calibrated Slope / Gradient Baseline: ~{user_base_slope}%
- Calibrated Peak Elevation Baseline: ~{user_base_masl} masl
- Target Effort Anchor: Easy (recovery/leisure baseline)
- Medical Profile: {med_details} ({'Physical factor applied: 20% difficulty reduction' if has_med_cond else 'Standard baseline'})
- Stated Province Preferences: {province}

Trail Attributes:
- Trail Name: {trail_name}
- Length: {distance_str}
- Peak Elevation: {elev_str}
- Elevation Gain: {gain_str}
- Slope / Gradient: {slope_str}
- Route Type: {circuit_str}
- Classification: {classification}
- Province: {province}

TARS Mathematical Scoring:
- Overall Hybrid Score R_tu: {raw_score:.4f} ({profile_match}% profile match)

Generate a JSON response strictly adhering to this schema (do NOT wrap in markdown backticks, output raw valid JSON):
{{
  "summary": "2-3 sentences providing an executive summary of why this trail is the #1 spotlight easy match for {month_label}.",
  "physicalFit": "1-2 sentences on how the trail length, elevation gain, peak MASL, and slope gradient match the hiker's cardiovascular stamina threshold.",
  "terrainFit": "1-2 sentences explaining how the {circuit_str} route layout and trail terrain provide comfortable navigation.",
  "provinceFit": "1 sentence on the geographic proximity and province match for accessible travel.",
  "safetyTips": "1-2 actionable, safety-first trail tips (hydration, footwear, weather pacing, medical mindfulness) tailored specifically for {trail_name}."
}}"""

    for model_name in CANDIDATE_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={key}"
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 700,
                "responseMimeType": "application/json"
            }
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=timeout_seconds) as response:
                if response.status == 200:
                    raw_data = json.loads(response.read().decode("utf-8"))
                    raw_text = raw_data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    cleaned = raw_text.replace("```json", "").replace("```", "").strip()
                    parsed = json.loads(cleaned)

                    if (
                        parsed.get("summary") and
                        parsed.get("physicalFit") and
                        parsed.get("terrainFit") and
                        parsed.get("provinceFit") and
                        parsed.get("safetyTips")
                    ):
                        logger.info(f"Generated reasoning for '{trail_name}' using {model_name}.")
                        reasoning_obj = {
                            "summary": parsed["summary"],
                            "physicalFit": parsed["physicalFit"],
                            "terrainFit": parsed["terrainFit"],
                            "provinceFit": parsed["provinceFit"],
                            "safetyTips": parsed["safetyTips"],
                            "generatedAt": datetime.utcnow().isoformat(),
                            "source": "gemini"
                        }
                        REASONING_CACHE[cache_key] = reasoning_obj
                        return reasoning_obj
        except urllib.error.HTTPError as http_err:
            logger.warning(f"Gemini API {model_name} HTTP {http_err.code}: {http_err.read().decode('utf-8', errors='ignore')}")
        except Exception as e:
            logger.warning(f"Gemini request failed for model {model_name}: {e}")

    logger.info(f"Using algorithmic fallback for '{trail_name}'.")
    fallback_obj = build_algorithmic_reasoning(
        trail_name, reco_item, profile_match, month_label, circuit_str,
        province, distance_str, gain_str, elev_str, slope_str, classification, has_med_cond,
        user_profile, raw_length, raw_gain, raw_slope
    )
    REASONING_CACHE[cache_key] = fallback_obj
    return fallback_obj
