# VoxEntity: Voice-Based Named Entity Recognition

A Flask + spaCy project that turns browser microphone speech into text and extracts named entities. The browser uses the Web Speech API for microphone input, so no audio file upload is required.

## Run locally

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python app.py
```

Open `http://127.0.0.1:5000` in Chrome or Edge and allow microphone access.

The app still provides a small rule-based fallback for the sample entities when `en_core_web_sm` is not installed.
