const textInput = document.querySelector('#textInput');
const recordButton = document.querySelector('#recordButton');
const recordLabel = document.querySelector('#recordLabel');
const recordHint = document.querySelector('#recordHint');
const analyzeButton = document.querySelector('#analyzeButton');
const charCount = document.querySelector('#charCount');
const emptyState = document.querySelector('#emptyState');
const results = document.querySelector('#results');
const entityList = document.querySelector('#entityList');
const counts = document.querySelector('#counts');
const entityTotal = document.querySelector('#entityTotal');
const speakButton = document.querySelector('#speakButton');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let latestEntities = [];

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.onstart = () => {
    recordButton.classList.add('recording');
    recordLabel.textContent = 'Listening...';
    recordHint.textContent = 'Speak clearly, then pause';
  };
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results).map((result) => result[0].transcript).join('');
    textInput.value = transcript;
    updateCount();
    if (event.results[event.results.length - 1].isFinal) analyze();
  };
  recognition.onerror = (event) => {
    recordHint.textContent = event.error === 'not-allowed' ? 'Microphone permission was blocked' : 'Could not hear that. Try again.';
  };
  recognition.onend = () => {
    recordButton.classList.remove('recording');
    recordLabel.textContent = 'Tap to speak';
    if (recordHint.textContent === 'Speak clearly, then pause') recordHint.textContent = 'Allow microphone access when prompted';
  };
} else {
  recordLabel.textContent = 'Voice unavailable';
  recordHint.textContent = 'Use Chrome or Edge for microphone input';
  recordButton.disabled = true;
}

recordButton.addEventListener('click', () => {
  if (!recognition) return;
  if (recordButton.classList.contains('recording')) recognition.stop();
  else recognition.start();
});
textInput.addEventListener('input', updateCount);
analyzeButton.addEventListener('click', analyze);
speakButton.addEventListener('click', () => {
  if (!latestEntities.length || !window.speechSynthesis) return;
  const sentence = latestEntities.map((entity) => `${entity.text}, ${entity.label}`).join('. ');
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(`I found ${sentence}.`));
});

function updateCount() {
  charCount.textContent = `${textInput.value.length} / 500`;
}

async function analyze() {
  const text = textInput.value.trim();
  if (!text) {
    textInput.focus();
    return;
  }
  analyzeButton.disabled = true;
  analyzeButton.innerHTML = 'Analyzing...';
  try {
    const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Analysis failed');
    renderResults(data);
  } catch (error) {
    recordHint.textContent = error.message;
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.innerHTML = 'Analyze text <span>↗</span>';
  }
}

function renderResults(data) {
  latestEntities = data.entities;
  emptyState.classList.add('hidden');
  results.classList.remove('hidden');
  entityTotal.textContent = data.entities.length;
  entityList.innerHTML = data.entities.length ? data.entities.map((entity) => `<div class="entity"><span class="entity-text">${escapeHtml(entity.text)}</span><span class="entity-label">${escapeHtml(entity.label)}</span></div>`).join('') : '<p class="intro">No named entities found in this sentence.</p>';
  counts.innerHTML = Object.entries(data.counts).map(([label, count]) => `<span class="count-chip">${escapeHtml(label)} · ${count}</span>`).join('');
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}
