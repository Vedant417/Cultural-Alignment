import fitz
from docx import Document
import re


# =========================================================
# FILE EXTRACTION
# =========================================================

def extract_text_from_pdf(file_path: str) -> str:

    text = ""

    pdf = fitz.open(file_path)

    for page in pdf:
        text += page.get_text()

    pdf.close()

    return text


def extract_text_from_docx(file_path: str) -> str:

    doc = Document(file_path)

    text = "\n".join(
        [para.text for para in doc.paragraphs]
    )

    return text


def extract_text_from_txt(file_path: str) -> str:

    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


# =========================================================
# SCREENPLAY STRUCTURE ENGINE
# =========================================================

def split_into_acts(screenplay_text: str):

    text = screenplay_text.strip()

    # Explicit act splitting first
    explicit_acts = re.split(
        r'ACT\s+ONE|ACT\s+TWO|ACT\s+THREE|ACT\s+1|ACT\s+2|ACT\s+3',
        text,
        flags=re.IGNORECASE
    )

    cleaned = [
        act.strip()
        for act in explicit_acts
        if len(act.strip()) > 100
    ]

    if len(cleaned) >= 3:

        return {
            "Act 1": cleaned[0],
            "Act 2": cleaned[1],
            "Act 3": cleaned[2]
        }

    # Fallback splitting by screenplay length

    total_length = len(text)

    one_third = total_length // 3

    return {

        "Act 1":
            text[:one_third],

        "Act 2":
            text[one_third:one_third * 2],

        "Act 3":
            text[one_third * 2:]
    }


# =========================================================
# SCENE DETECTION
# =========================================================

def detect_scenes(screenplay_text: str):

    scenes = re.findall(
        r'(INT\.|EXT\.)',
        screenplay_text
    )

    return len(scenes)


# =========================================================
# DIALOGUE ANALYSIS
# =========================================================

def analyze_dialogue(screenplay_text: str):

    lines = screenplay_text.splitlines()

    dialogue_count = 0

    for line in lines:

        stripped = line.strip()

        if (
            stripped.isupper()
            and 2 < len(stripped) < 35
            and not stripped.startswith(("INT", "EXT", "ACT"))
        ):
            dialogue_count += 1

    return dialogue_count


# =========================================================
# ACTION ANALYSIS
# =========================================================

def analyze_action_density(screenplay_text: str):

    action_keywords = [

        "explosion",
        "gunfire",
        "scream",
        "panic",
        "collision",
        "fight",
        "chase",
        "attack",
        "impact",
        "crash",
        "run",
        "escape",
        "alarm",
        "danger",
        "destroy",
        "collapse",
        "warning",
        "violent",
        "shockwave",
        "eruption",
        "breach",
        "fire"
    ]

    text = screenplay_text.lower()

    score = 0

    for word in action_keywords:
        score += text.count(word)

    return score

# =========================================================
# EMOTION ANALYSIS
# =========================================================

def analyze_emotions(screenplay_text: str):

    emotion_keywords = {

        "joy": [
            "hope",
            "love",
            "smile",
            "peace",
            "beautiful",
            "survive",
            "humanity"
        ],

        "drama": [
            "loss",
            "pain",
            "death",
            "sacrifice",
            "alone",
            "humanity",
            "survival",
            "existence",
            "collapse",
            "emotional",
            "goodbye",
            "save",
            "memory"
        ],

        "suspense": [
            "signal",
            "unknown",
            "warning",
            "anomaly",
            "black hole",
            "time",
            "distortion",
            "static",
            "unstable",
            "alarm"
        ]
    }

    text = screenplay_text.lower()

    scores = {}

    total = 0

    for emotion, words in emotion_keywords.items():

        count = 0

        for word in words:
            count += text.count(word)

        scores[emotion] = count

        total += count

    total = max(total, 1)

    for emotion in scores:

        scores[emotion] = round(
            (scores[emotion] / total) * 100,
            1
        )

    return scores