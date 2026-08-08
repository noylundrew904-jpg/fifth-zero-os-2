/* ============================================================
   NOEL OS — voice capture abstraction
   ------------------------------------------------------------
   transcribeAudio() is the ONE seam a dedicated speech-to-text
   provider (Whisper, Deepgram, Google STT) would replace later.
   Today it wraps the browser's built-in SpeechRecognition, which
   is free and needs no API key, but is only available in
   Chromium-based browsers over a secure context (https or
   localhost).
   ============================================================ */

const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;

function isVoiceSupported() { return !!SpeechRecognitionImpl; }

/**
 * transcribeAudio({ onState, onResult, onError })
 * Returns a controller: { stop() }
 * onState receives: 'listening' | 'understanding' | 'done' | 'error'
 */
function transcribeAudio({ onState, onResult, onError }) {
  if (!SpeechRecognitionImpl) {
    onError && onError(new Error('Voice recognition is not supported in this browser. Try Chrome or Edge, or use the text capture box instead.'));
    return { stop() {} };
  }
  const recognition = new SpeechRecognitionImpl();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => onState && onState('listening');
  recognition.onspeechend = () => onState && onState('understanding');
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results).map(r => r[0].transcript).join(' ').trim();
    onState && onState('done');
    onResult && onResult(transcript);
  };
  recognition.onerror = (event) => {
    onError && onError(new Error(event.error === 'not-allowed'
      ? 'Microphone permission was denied.'
      : `Voice recognition error: ${event.error}`));
  };
  recognition.onend = () => onState && onState('idle');

  try { recognition.start(); } catch (e) { onError && onError(e); }
  return { stop() { try { recognition.stop(); } catch (e) {} } };
}

const NoelVoice = { isVoiceSupported, transcribeAudio };
