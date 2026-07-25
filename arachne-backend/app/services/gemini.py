import json
import urllib.request
import urllib.error
from app.config import settings

def query_gemini(prompt: str) -> str:
    """
    Sends a query to the Gemini API using built-in urllib to avoid external dependencies.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        print("WARNING: GEMINI_API_KEY is not set. Returning offline mock AI insights.")
        return get_mock_ai_response(prompt)

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=30) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            
            # Extract text from response
            candidates = res_json.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")
            return "Error: Empty response from Gemini API."
    except urllib.error.HTTPError as e:
        print(f"Gemini API HTTP Error {e.code}: {e.read().decode('utf-8', errors='ignore')}")
        return f"Offline Backup AI Mode: API connection returned HTTP {e.code}. Returning mock insights."
    except Exception as e:
        print(f"Gemini API Connection Error: {str(e)}")
        return f"Offline Backup AI Mode: {str(e)}. Returning mock insights."

def get_mock_ai_response(prompt: str) -> str:
    """
    Returns mock tactical case summaries when Gemini API key is missing.
    """
    prompt_lower = prompt.lower()
    if "s1" in prompt_lower or "malhotra" in prompt_lower:
        return (
            "**Intelligence Dossier for Vikram Malhotra (Main Suspect):**\n\n"
            "Vikram Malhotra is suspected to be the central coordinator for the Sector-4 smuggling network. "
            "Financial intelligence registers show suspicious transaction routing matching known shell company profiles. "
            "Network analysis maps active contact lines to Amit Shah (Associate) and Rohan Joshi (Logistics). "
            "Patrol reports indicate high-frequency movement of the black SUV (KA-51-MD-9876) owned by Malhotra near Cargo Terminal 8B."
        )
    elif "s2" in prompt_lower or "shah" in prompt_lower:
        return (
            "**Intelligence Dossier for Amit Shah (Associate):**\n\n"
            "Amit Shah acts as the primary intermediary between Malhotra and field logistics handlers. "
            "Burner line analysis logs multiple encrypted communications originating from cell towers near cargo zones. "
            "Shah is currently linked to FIR-2026/89 (Smuggling) and has been seen driving the white sedan (MH-12-AS-1284)."
        )
    elif "s3" in prompt_lower or "joshi" in prompt_lower:
        return (
            "**Intelligence Dossier for Rohan Joshi (Under Surveillance):**\n\n"
            "Rohan Joshi is suspected of managing communications infrastructure. Burner phone sweeps "
            "associate Joshi's device (+91 65432 10987) with secondary logistics channels. Link analysis indicates "
            "coordination with Amit Shah's cell tower clusters."
        )
    elif "s4" in prompt_lower or "singhal" in prompt_lower:
        return (
            "**Intelligence Dossier for Karan Singhal (Logistics):**\n\n"
            "Karan Singhal operates local fleet drop-offs. Telemetry logs link Singhal to the delivery van (DL-03-KS-4242) "
            "and FIR-2026/188 (Cargo Theft)."
        )
    elif "s5" in prompt_lower or "dutt" in prompt_lower:
        return (
            "**Intelligence Dossier for Sanjay Dutt (Informant/Suspect):**\n\n"
            "Sanjay Dutt operates a prepaid communications node. Tower sweeps log contact with Malhotra's primary burner "
            "device during off-shift hours. Linked to FIR-2026/102 (Conspiracy)."
        )
    elif "incident" in prompt_lower or "crime" in prompt_lower or "hotspot" in prompt_lower:
        return (
            "**Tactical Incident & Hotspot Analysis Summary:**\n\n"
            "Spatial clustering reports indicate 2 core density hotspots (ZONE-ALPHA near Indiranagar, ZONE-BRAVO near Koramangala). "
            "Incident class Armed Robbery and Assault peak during the Night Shift. It is recommended to deploy "
            "patrol units near Sector 4 grids during peak night hours."
        )
    else:
        return (
            "**Tactical Assistant Summary:**\n\n"
            "Analyzed case parameters successfully. Suspect connectivity indicates a closed network utilizing prepay burner lines "
            "under Sector 4 cell towers. Active monitoring of the Black SUV (KA-51-MD-9876) remains the highest operational priority."
        )
