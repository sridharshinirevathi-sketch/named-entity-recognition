from collections import Counter
import re

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

try:
    import spacy

    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError:
        nlp = spacy.blank("en")
except ImportError:
    spacy = None
    nlp = None


def fallback_entities(text):
    """Keep the demo useful when the optional spaCy model is not installed."""
    patterns = [
        ("DATE", r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?\b"),
        ("DATE", r"\b(?:today|tomorrow|yesterday)\b"),
        ("ORGANIZATION", r"\b(?:Microsoft|Google|Apple|OpenAI|NASA|Tesla|Meta)\b"),
        ("LOCATION", r"\b(?:India|Chennai|London|New York|Paris|Tokyo|Bengaluru|Bangalore)\b"),
        ("PERSON", r"\b(?:Elon Musk|Satya Nadella|Sundar Pichai|Albert Einstein)\b"),
    ]
    found = []
    occupied = set()
    for label, pattern in patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            span = set(range(match.start(), match.end()))
            if not span.intersection(occupied):
                found.append({"text": match.group(), "label": label, "start": match.start(), "end": match.end()})
                occupied.update(span)
    return sorted(found, key=lambda entity: entity["start"])


def extract_entities(text):
    if nlp and spacy and nlp.meta.get("name") == "core_web_sm":
        doc = nlp(text)
        return [
            {"text": entity.text, "label": entity.label_, "start": entity.start_char, "end": entity.end_char}
            for entity in doc.ents
        ]
    return fallback_entities(text)


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/analyze")
def analyze():
    payload = request.get_json(silent=True) or {}
    text = (payload.get("text") or "").strip()
    if not text:
        return jsonify({"error": "Please provide text to analyze."}), 400

    entities = extract_entities(text)
    counts = Counter(entity["label"] for entity in entities)
    return jsonify({"text": text, "entities": entities, "counts": dict(counts)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=2709, debug=False)
